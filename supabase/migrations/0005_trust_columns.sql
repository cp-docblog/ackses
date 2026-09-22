-- Protect the trust signals on sellers and shops.
--
-- 0003 and 0004 let an account create its own seller record and shop, but the
-- policies only constrain *which rows* it may write, not *which columns*. That
-- left a seller free to insert themselves with `verified = true`, a 5.0 rating
-- and any follower count they liked — forging exactly the signals buyers use
-- to decide who to trust.
--
-- These columns are earned, not declared: they are owned by the platform and
-- may only be set by a privileged role. A trigger is used rather than column
-- grants because Supabase re-applies broad table grants, which would silently
-- undo a `revoke ... (column)`.

create or replace function public.is_privileged_writer()
returns boolean
language sql
stable
as $$
  -- service_role is the server-side key; the others are migration/admin roles.
  select current_user in ('service_role', 'postgres', 'supabase_admin');
$$;

comment on function public.is_privileged_writer is
  'True for back-end roles that may write platform-owned columns (verification, ratings, counts).';

-- ─────────────────────────────────────────────────────────────
-- Sellers
-- ─────────────────────────────────────────────────────────────

create or replace function public.guard_seller_trust_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A new seller starts unverified with no history, whatever they asked for.
    new.verified      := false;
    new.rating        := 0;
    new.orders_count  := 0;
    new.response_time := '< 24h';
  else
    -- On update these keep whatever the platform last set them to.
    new.verified      := old.verified;
    new.rating        := old.rating;
    new.orders_count  := old.orders_count;
    new.response_time := old.response_time;
    new.user_id       := old.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_seller_trust on public.sellers;

create trigger guard_seller_trust
  before insert or update on public.sellers
  for each row execute function public.guard_seller_trust_columns();

-- ─────────────────────────────────────────────────────────────
-- Shops
-- ─────────────────────────────────────────────────────────────

create or replace function public.guard_shop_trust_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified      := false;
    new.rating        := 0;
    new.product_count := 0;
    new.response_rate := 0;
    new.followers     := '0';
    -- A shop cannot predate the account that opened it.
    new.since         := greatest(new.since, extract(year from now())::int);
  else
    new.verified      := old.verified;
    new.rating        := old.rating;
    new.product_count := old.product_count;
    new.response_rate := old.response_rate;
    new.followers     := old.followers;
    new.since         := old.since;
    -- A shop cannot be handed to a different seller from the client.
    new.seller_id     := old.seller_id;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_shop_trust on public.shops;

create trigger guard_shop_trust
  before insert or update on public.shops
  for each row execute function public.guard_shop_trust_columns();

-- ─────────────────────────────────────────────────────────────
-- Reviews
-- ─────────────────────────────────────────────────────────────

-- Same class of problem: the displayed author name is free text, so a review
-- could be posted under someone else's name. Pin it to the account's profile.
create or replace function public.guard_review_author()
returns trigger
language plpgsql
-- Deliberately invoker rights: is_privileged_writer() reads current_user,
-- which SECURITY DEFINER would report as the function owner and so wave every
-- write through. Reading profiles needs no elevation — the select policy
-- already allows it for signed-in users.
set search_path = public
as $$
declare
  v_name text;
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  select nullif(full_name, '') into v_name from public.profiles where id = auth.uid();

  new.author_id := auth.uid();
  new.author_en := coalesce(v_name, new.author_en);
  new.author_ar := coalesce(v_name, new.author_ar);

  return new;
end;
$$;

drop trigger if exists guard_review_author on public.reviews;

create trigger guard_review_author
  before insert on public.reviews
  for each row execute function public.guard_review_author();

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────

-- `place_order` sets the total from the client's own arithmetic. Recompute it
-- from the line items so a tampered request cannot under-pay a shop.
create or replace function public.guard_order_total()
returns trigger
language plpgsql
-- Invoker rights, for the same reason as guard_review_author above.
set search_path = public
as $$
declare
  v_items_total int;
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  select coalesce(sum(unit_price_iqd * qty), 0) into v_items_total
  from public.order_items
  where order_id = new.id;

  -- Delivery is added on top, so the stored total may exceed the line items
  -- but must never fall below them.
  if v_items_total > 0 and new.total_iqd < v_items_total then
    raise exception 'order total % is below its line items (%)', new.total_iqd, v_items_total;
  end if;

  return new;
end;
$$;

comment on function public.guard_order_total is
  'Rejects an order whose stored total is less than the sum of its line items.';

drop trigger if exists check_order_total on public.orders;

-- Deferred to commit: place_order writes the order before its line items, so
-- an immediate trigger would always see an empty basket.
create constraint trigger check_order_total
  after insert on public.orders
  deferrable initially deferred
  for each row execute function public.guard_order_total();
