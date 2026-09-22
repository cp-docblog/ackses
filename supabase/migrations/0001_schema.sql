-- ACKSES marketplace — core schema.
--
-- Localized text is stored as paired `*_en` / `*_ar` columns rather than a
-- translations table: every string in this product is authored in both
-- languages at once, and the app always reads both sides.
--
-- Categories are addressed by position (0-5) so the app can keep rendering
-- category names from its own string tables while the database stays the
-- source of truth for which products sit where.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────

create type public.part_condition as enum ('new', 'used', 'refurbished');

create type public.order_status as enum (
  'received',
  'preparing',
  'shipped',
  'out_for_delivery',
  'delivered'
);

create type public.payment_method as enum ('cod', 'card');

-- ─────────────────────────────────────────────────────────────
-- People
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  phone text,
  city_en text not null default 'Baghdad',
  city_ar text not null default 'بغداد',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per signed-in user; buyers and sellers alike.';

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  -- Null for the seeded demo seller; set once a real account claims it.
  user_id uuid unique references auth.users on delete set null,
  name_en text not null,
  name_ar text not null,
  initial_en text not null,
  initial_ar text not null,
  verified boolean not null default false,
  member_since int not null,
  rating numeric(2, 1) not null default 0,
  orders_count int not null default 0,
  response_time text not null default '< 24h',
  city_en text not null,
  city_ar text not null,
  created_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers on delete cascade,
  name_en text not null,
  name_ar text not null,
  initial text not null,
  city_en text not null,
  city_ar text not null,
  address_en text not null default '',
  address_ar text not null default '',
  about_en text not null default '',
  about_ar text not null default '',
  since int not null,
  verified boolean not null default false,
  rating numeric(2, 1) not null default 0,
  product_count int not null default 0,
  response_rate int not null default 0,
  followers text not null default '0',
  hours text not null default '9:00 – 21:00',
  delivery_fee_iqd int not null default 0,
  created_at timestamptz not null default now()
);

create index shops_seller_id_idx on public.shops (seller_id);

create table public.shop_follows (
  shop_id uuid not null references public.shops on delete cascade,
  follower_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shop_id, follower_id)
);

-- ─────────────────────────────────────────────────────────────
-- Catalogue
-- ─────────────────────────────────────────────────────────────

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops on delete cascade,
  name_en text not null,
  name_ar text not null,
  oem text not null,
  brand text not null,
  -- Index into the app's category list (Brakes, Engine, Filters, …).
  category_position int not null check (category_position between 0 and 5),
  subcategory_position int check (subcategory_position >= 0),
  condition public.part_condition not null default 'new',
  price_iqd int not null check (price_iqd >= 0),
  stock int not null default 0 check (stock >= 0),
  image_label text not null default 'part',
  image_url text,
  description text not null default '',
  -- Index into the shop's delivery options.
  delivery_option int not null default 0,
  -- [{ "key": {"en","ar"}, "value": {"en","ar"} }]
  specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  -- Soft delete: orders reference products, so rows have to survive removal.
  deleted_at timestamptz
);

create index products_shop_id_idx on public.products (shop_id) where deleted_at is null;
create index products_category_idx on public.products (category_position) where deleted_at is null;
create index products_oem_idx on public.products (oem) where deleted_at is null;
create index products_brand_idx on public.products (brand) where deleted_at is null;
create index products_price_idx on public.products (price_iqd) where deleted_at is null;

-- Free-text search covers both languages plus the OEM number.
create index products_search_idx on public.products
  using gin ((name_en || ' ' || name_ar || ' ' || oem || ' ' || brand) gin_trgm_ops);

-- Which vehicles a part fits. This is what powers the "Fits" badge and the
-- "Fits my car" filter, so it is a first-class table rather than a jsonb blob.
create table public.product_fitments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  make text not null,
  model text not null,
  year_from int not null,
  year_to int not null,
  check (year_to >= year_from)
);

create index product_fitments_product_id_idx on public.product_fitments (product_id);
create index product_fitments_lookup_idx on public.product_fitments (make, model, year_from, year_to);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops on delete cascade,
  author_id uuid references auth.users on delete set null,
  author_en text not null,
  author_ar text not null,
  stars int not null check (stars between 1 and 5),
  text_en text not null default '',
  text_ar text not null default '',
  created_at timestamptz not null default now()
);

create index reviews_shop_id_idx on public.reviews (shop_id);

-- ─────────────────────────────────────────────────────────────
-- Buyer state
-- ─────────────────────────────────────────────────────────────

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  vin text,
  created_at timestamptz not null default now()
);

create index vehicles_owner_id_idx on public.vehicles (owner_id);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  query_en text not null,
  query_ar text not null,
  meta_en text not null default '',
  meta_ar text not null default '',
  alerts_enabled boolean not null default true,
  -- The ProductFilters object the search was saved from.
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index saved_searches_owner_id_idx on public.saved_searches (owner_id);

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────

create sequence public.order_reference_seq start 20000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'AK-' || nextval('public.order_reference_seq'),
  shop_id uuid not null references public.shops on delete restrict,
  buyer_id uuid references auth.users on delete set null,
  buyer_name_en text not null default '',
  buyer_name_ar text not null default '',
  city_en text not null,
  city_ar text not null,
  status public.order_status not null default 'received',
  total_iqd int not null check (total_iqd >= 0),
  payment_method public.payment_method not null default 'cod',
  created_at timestamptz not null default now()
);

create index orders_shop_id_idx on public.orders (shop_id);
create index orders_buyer_id_idx on public.orders (buyer_id);

-- Line items snapshot price and name so a later edit to the product does not
-- rewrite history.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  name_en text not null,
  name_ar text not null,
  oem text not null default '',
  condition public.part_condition not null default 'new',
  unit_price_iqd int not null check (unit_price_iqd >= 0),
  qty int not null check (qty > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

-- Append-only status history; the seller's timeline reads from here.
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Read models
-- ─────────────────────────────────────────────────────────────

-- Products with their fitment ranges folded in, shaped for the client.
create view public.products_with_fitments
with (security_invoker = true) as
select
  p.*,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'make', f.make,
          'model', f.model,
          'yearFrom', f.year_from,
          'yearTo', f.year_to
        )
        order by f.make, f.model
      )
      from public.product_fitments f
      where f.product_id = p.id
    ),
    '[]'::jsonb
  ) as fitments
from public.products p;

-- Orders with their line items and status timeline folded in.
create view public.orders_with_items
with (security_invoker = true) as
select
  o.*,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'productId', i.product_id,
          'name', jsonb_build_object('en', i.name_en, 'ar', i.name_ar),
          'oem', i.oem,
          'condition', i.condition,
          'unitPriceIqd', i.unit_price_iqd,
          'qty', i.qty
        )
      )
      from public.order_items i
      where i.order_id = o.id
    ),
    '[]'::jsonb
  ) as items,
  coalesce(
    (
      -- One entry per status, keeping the earliest timestamp for each.
      select jsonb_object_agg(e.status, e.first_seen)
      from (
        select status, min(created_at) as first_seen
        from public.order_events
        where order_id = o.id
        group by status
      ) e
    ),
    '{}'::jsonb
  ) as timeline
from public.orders o;
