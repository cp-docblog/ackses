-- Advanced product search and order placement.
--
-- `search_products` is the single entry point behind the Listings screen and
-- the filter sheet. It lives in the database because the "Fits my car" filter
-- needs a join against product_fitments, and doing that client-side would mean
-- shipping the whole fitment table to the phone.
--
-- Keep the filter semantics here in step with `matchesLocally()` in
-- `src/data/repository.ts`, which serves the same query from demo fixtures.

create or replace function public.search_products(
  p_text text default null,
  p_category_position int default null,
  p_subcategory_position int default null,
  p_condition public.part_condition default null,
  p_brand text default null,
  p_city text default null,
  p_min_price int default 0,
  p_max_price int default 2147483647,
  p_fits_only boolean default false,
  p_make text default null,
  p_model text default null,
  p_year int default null
)
returns table (
  id uuid,
  shop_id uuid,
  name_en text,
  name_ar text,
  oem text,
  brand text,
  category_position int,
  subcategory_position int,
  condition public.part_condition,
  price_iqd int,
  stock int,
  image_label text,
  image_url text,
  specs jsonb,
  fitments jsonb,
  fits boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.shop_id,
    p.name_en,
    p.name_ar,
    p.oem,
    p.brand,
    p.category_position,
    p.subcategory_position,
    p.condition,
    p.price_iqd,
    p.stock,
    p.image_label,
    p.image_url,
    p.specs,
    p.fitments,
    -- "Fits" badge: true when the buyer's car falls inside a fitment range.
    (
      p_make is not null
      and exists (
        select 1
        from public.product_fitments f
        where f.product_id = p.id
          and f.make = p_make
          and f.model = p_model
          and p_year between f.year_from and f.year_to
      )
    ) as fits
  from public.products_with_fitments p
  join public.shops s on s.id = p.shop_id
  where p.deleted_at is null
    -- Free text over both languages, the OEM number and the brand. The OEM
    -- number is matched with dashes stripped too, since buyers type it either
    -- way off the old part.
    and (
      p_text is null
      or p.name_en ilike '%' || p_text || '%'
      or p.name_ar ilike '%' || p_text || '%'
      or p.brand ilike '%' || p_text || '%'
      or p.oem ilike '%' || p_text || '%'
      or replace(p.oem, '-', '') ilike '%' || replace(p_text, '-', '') || '%'
    )
    and (p_category_position is null or p.category_position = p_category_position)
    and (p_subcategory_position is null or p.subcategory_position = p_subcategory_position)
    and (p_condition is null or p.condition = p_condition)
    and (p_brand is null or p.brand = p_brand)
    -- The city filter is matched against either language, because the chips
    -- send whatever label the buyer is currently reading.
    and (p_city is null or s.city_en = p_city or s.city_ar = p_city)
    and p.price_iqd between coalesce(p_min_price, 0) and coalesce(p_max_price, 2147483647)
    and (
      not coalesce(p_fits_only, false)
      or exists (
        select 1
        from public.product_fitments f
        where f.product_id = p.id
          and f.make = p_make
          and f.model = p_model
          and p_year between f.year_from and f.year_to
      )
    )
  order by
    -- Parts that fit the buyer's car come first, then newest.
    (
      p_make is not null
      and exists (
        select 1
        from public.product_fitments f
        where f.product_id = p.id
          and f.make = p_make
          and f.model = p_model
          and p_year between f.year_from and f.year_to
      )
    ) desc,
    p.created_at desc;
$$;

comment on function public.search_products is
  'Listings search: text/OEM, category tree, condition, brand, city, price range and my-car fitment.';

-- ─────────────────────────────────────────────────────────────
-- Checkout
-- ─────────────────────────────────────────────────────────────

-- Creates the order, its line items and the opening `received` event in one
-- transaction, so a half-written order can never be observed.
create or replace function public.place_order(
  p_shop_id uuid,
  p_total_iqd int,
  p_city_en text,
  p_city_ar text,
  p_payment_method public.payment_method,
  p_items jsonb
)
returns table (id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'place_order requires an authenticated user';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'place_order requires at least one item';
  end if;

  select coalesce(full_name, '') into v_name from public.profiles where profiles.id = auth.uid();

  insert into public.orders (
    shop_id, buyer_id, buyer_name_en, buyer_name_ar,
    city_en, city_ar, status, total_iqd, payment_method
  )
  values (
    p_shop_id, auth.uid(), coalesce(v_name, ''), coalesce(v_name, ''),
    p_city_en, p_city_ar, 'received', p_total_iqd, p_payment_method
  )
  returning orders.id into v_order_id;

  insert into public.order_items (
    order_id, product_id, name_en, name_ar, oem, condition, unit_price_iqd, qty
  )
  select
    v_order_id,
    (item ->> 'productId')::uuid,
    item -> 'name' ->> 'en',
    item -> 'name' ->> 'ar',
    coalesce(item ->> 'oem', ''),
    coalesce((item ->> 'condition')::public.part_condition, 'new'),
    (item ->> 'unitPriceIqd')::int,
    (item ->> 'qty')::int
  from jsonb_array_elements(p_items) as item;

  insert into public.order_events (order_id, status) values (v_order_id, 'received');

  return query select v_order_id;
end;
$$;

comment on function public.place_order is
  'Creates an order, its line items and the opening status event atomically.';
