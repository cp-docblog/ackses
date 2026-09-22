-- search_products declared its own return table in 0002, so the columns 0008
-- added to products (bulk_tiers, image_urls, description, delivery_option)
-- never reached the listings or the cart, which prices bulk tiers from this
-- result. A function's return type cannot be altered in place.
drop function if exists public.search_products(text, int, int, public.part_condition, text, text, int, int, boolean, text, text, int);

create function public.search_products(
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
  id uuid, shop_id uuid, name_en text, name_ar text, oem text, brand text,
  category_position int, subcategory_position int, condition public.part_condition,
  price_iqd int, stock int, image_label text, image_url text, specs jsonb, fitments jsonb, fits boolean,
  bulk_tiers jsonb, image_urls text[], description text, delivery_option int, created_at timestamptz
)
language sql stable security invoker set search_path = public
as $$
  select
    p.id, p.shop_id, p.name_en, p.name_ar, p.oem, p.brand,
    p.category_position, p.subcategory_position, p.condition,
    p.price_iqd, p.stock, p.image_label, p.image_url, p.specs, p.fitments,
    (p_make is not null and exists (
      select 1 from public.product_fitments f
      where f.product_id = p.id and f.make = p_make and f.model = p_model
        and p_year between f.year_from and f.year_to)) as fits,
    p.bulk_tiers, p.image_urls, p.description, p.delivery_option, p.created_at
  from public.products_with_fitments p
  join public.shops s on s.id = p.shop_id
  where p.deleted_at is null
    and (p_text is null
      or p.name_en ilike '%' || p_text || '%'
      or p.name_ar ilike '%' || p_text || '%'
      or p.brand ilike '%' || p_text || '%'
      or p.oem ilike '%' || p_text || '%'
      or replace(p.oem, '-', '') ilike '%' || replace(p_text, '-', '') || '%')
    and (p_category_position is null or p.category_position = p_category_position)
    and (p_subcategory_position is null or p.subcategory_position = p_subcategory_position)
    and (p_condition is null or p.condition = p_condition)
    and (p_brand is null or p.brand = p_brand)
    and (p_city is null or s.city_en = p_city or s.city_ar = p_city)
    and p.price_iqd between coalesce(p_min_price, 0) and coalesce(p_max_price, 2147483647)
    and (not coalesce(p_fits_only, false) or exists (
      select 1 from public.product_fitments f
      where f.product_id = p.id and f.make = p_make and f.model = p_model
        and p_year between f.year_from and f.year_to))
  order by
    (p_make is not null and exists (
      select 1 from public.product_fitments f
      where f.product_id = p.id and f.make = p_make and f.model = p_model
        and p_year between f.year_from and f.year_to)) desc,
    p.created_at desc;
$$;
comment on function public.search_products is
  'Listings search: text/OEM, category tree, condition, brand, city, price range and my-car fitment.';
