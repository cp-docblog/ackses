-- Columns and tables behind the controls that were previously stubbed:
-- profile editing, addresses, notification and payment preferences, shop
-- editing and contact details, bulk pricing tiers, payouts, and seller reports.

alter table public.profiles
  add column if not exists addresses jsonb not null default '[]'::jsonb,
  add column if not exists notification_prefs jsonb not null default '{"orders":true,"alerts":true,"marketing":false}'::jsonb,
  add column if not exists payment_preference public.payment_method not null default 'cod';

alter table public.sellers
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists payout_method jsonb not null default '{}'::jsonb;

alter table public.shops
  add column if not exists phone text;

-- [{ "minQty": 4, "maxQty": 9, "priceIqd": 41000 }]
alter table public.products
  add column if not exists bulk_tiers jsonb not null default '[]'::jsonb;

-- The read model has to expose the new column too.
create or replace view public.products_with_fitments
with (security_invoker = true) as
select
  p.*,
  coalesce(
    (select jsonb_agg(jsonb_build_object('make', f.make, 'model', f.model, 'yearFrom', f.year_from, 'yearTo', f.year_to) order by f.make, f.model)
     from public.product_fitments f where f.product_id = p.id),
    '[]'::jsonb
  ) as fitments
from public.products p;

-- ─────────────────────────────────────────────────────────────
-- Payouts: a seller asks for their balance to be sent out
-- ─────────────────────────────────────────────────────────────

create type public.payout_status as enum ('pending', 'paid', 'rejected');

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers on delete cascade,
  amount_iqd int not null check (amount_iqd > 0),
  method jsonb not null default '{}'::jsonb,
  status public.payout_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index payouts_seller_id_idx on public.payouts (seller_id, created_at desc);

alter table public.payouts enable row level security;

create policy "a seller sees their own payouts"
  on public.payouts for select to authenticated
  using (exists (select 1 from public.sellers s where s.id = payouts.seller_id and s.user_id = auth.uid()));

create policy "a seller requests their own payouts"
  on public.payouts for insert to authenticated
  with check (
    status = 'pending'
    and exists (select 1 from public.sellers s where s.id = payouts.seller_id and s.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Reports: a buyer flags a seller
-- ─────────────────────────────────────────────────────────────

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users on delete cascade,
  seller_id uuid not null references public.sellers on delete cascade,
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
create index reports_seller_id_idx on public.reports (seller_id);

alter table public.reports enable row level security;

create policy "a user sees their own reports"
  on public.reports for select to authenticated using (reporter_id = auth.uid());

create policy "a user files their own reports"
  on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- Contact details for the seeded seller, so Message / Call have somewhere to go.
update public.sellers
set phone = '+9647701234412', whatsapp = '9647701234412'
where id = '00000000-0000-4000-8000-000000000101';

update public.shops set phone = '+9647701234412'
where seller_id = '00000000-0000-4000-8000-000000000101';

update public.products
set bulk_tiers = '[{"minQty":1,"maxQty":3,"priceIqd":45000},{"minQty":4,"maxQty":9,"priceIqd":41000}]'::jsonb
where id = '00000000-0000-4000-8000-000000000301';

-- ─────────────────────────────────────────────────────────────
-- Delivery details on orders, and shop name / seller note in the read model
-- ─────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists address text not null default '',
  add column if not exists phone text not null default '';

create or replace view public.orders_with_items
with (security_invoker = true) as
select
  o.*,
  coalesce(
    (select jsonb_agg(jsonb_build_object('productId', i.product_id, 'name', jsonb_build_object('en', i.name_en, 'ar', i.name_ar), 'oem', i.oem, 'condition', i.condition, 'unitPriceIqd', i.unit_price_iqd, 'qty', i.qty))
     from public.order_items i where i.order_id = o.id),
    '[]'::jsonb
  ) as items,
  coalesce(
    (select jsonb_object_agg(e.status, e.first_seen)
     from (select status, min(created_at) as first_seen from public.order_events where order_id = o.id group by status) e),
    '{}'::jsonb
  ) as timeline,
  s.name_en as shop_name_en,
  s.name_ar as shop_name_ar,
  (select e.note from public.order_events e where e.order_id = o.id and e.note is not null order by e.created_at desc limit 1) as last_note
from public.orders o
join public.shops s on s.id = o.shop_id;

drop function if exists public.place_order(uuid, int, text, text, public.payment_method, jsonb);

create or replace function public.place_order(
  p_shop_id uuid, p_total_iqd int, p_city_en text, p_city_ar text,
  p_payment_method public.payment_method, p_items jsonb,
  p_address text default '', p_phone text default ''
)
returns table (id uuid)
language plpgsql security invoker set search_path = public
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
  insert into public.orders (shop_id, buyer_id, buyer_name_en, buyer_name_ar, city_en, city_ar, status, total_iqd, payment_method, address, phone)
  values (p_shop_id, auth.uid(), coalesce(v_name, ''), coalesce(v_name, ''), p_city_en, p_city_ar, 'received', p_total_iqd, p_payment_method, coalesce(p_address, ''), coalesce(p_phone, ''))
  returning orders.id into v_order_id;
  insert into public.order_items (order_id, product_id, name_en, name_ar, oem, condition, unit_price_iqd, qty)
  select v_order_id, (item ->> 'productId')::uuid, item -> 'name' ->> 'en', item -> 'name' ->> 'ar',
    coalesce(item ->> 'oem', ''), coalesce((item ->> 'condition')::public.part_condition, 'new'),
    (item ->> 'unitPriceIqd')::int, (item ->> 'qty')::int
  from jsonb_array_elements(p_items) as item;
  insert into public.order_events (order_id, status) values (v_order_id, 'received');
  return query select v_order_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Product photos: a public bucket, writable by signed-in sellers
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product photos are public"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-photos');

-- Files live under <user id>/..., so a seller can only write their own folder.
create policy "a seller uploads into their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "a seller replaces or removes their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);
