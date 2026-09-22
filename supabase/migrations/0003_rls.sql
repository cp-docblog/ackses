-- Row level security.
--
-- Shape of the rules:
--   · The catalogue (sellers, shops, products, fitments, reviews) is public
--     read — buyers browse before signing in.
--   · Everything a shop owns is writable only by the account behind that shop.
--   · Everything a buyer owns (garage, saved searches) is private to them.
--   · An order is visible to its buyer and to the shop it was placed with.

alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.shops enable row level security;
alter table public.shop_follows enable row level security;
alter table public.products enable row level security;
alter table public.product_fitments enable row level security;
alter table public.reviews enable row level security;
alter table public.vehicles enable row level security;
alter table public.saved_searches enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────

-- Security definer so the check itself is not blocked by the policies it
-- supports; it reads nothing the caller could not already infer.
create or replace function public.owns_shop(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shops s
    join public.sellers sl on sl.id = s.seller_id
    where s.id = p_shop_id
      and sl.user_id = auth.uid()
  );
$$;

revoke execute on function public.owns_shop(uuid) from public;
grant execute on function public.owns_shop(uuid) to authenticated;

create or replace function public.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (o.buyer_id = auth.uid() or public.owns_shop(o.shop_id))
  );
$$;

revoke execute on function public.owns_order(uuid) from public;
grant execute on function public.owns_order(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────

create policy "profiles are readable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "a user writes only their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "a user updates only their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Catalogue — public read
-- ─────────────────────────────────────────────────────────────

create policy "sellers are public"
  on public.sellers for select
  to anon, authenticated
  using (true);

create policy "a seller updates their own record"
  on public.sellers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "shops are public"
  on public.shops for select
  to anon, authenticated
  using (true);

create policy "a seller manages their own shops"
  on public.shops for all
  to authenticated
  using (
    exists (
      select 1 from public.sellers sl
      where sl.id = shops.seller_id and sl.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sellers sl
      where sl.id = shops.seller_id and sl.user_id = auth.uid()
    )
  );

create policy "listed products are public"
  on public.products for select
  to anon, authenticated
  using (deleted_at is null or public.owns_shop(shop_id));

create policy "a shop owner manages their products"
  on public.products for insert
  to authenticated
  with check (public.owns_shop(shop_id));

create policy "a shop owner updates their products"
  on public.products for update
  to authenticated
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

create policy "a shop owner deletes their products"
  on public.products for delete
  to authenticated
  using (public.owns_shop(shop_id));

create policy "fitments are public"
  on public.product_fitments for select
  to anon, authenticated
  using (true);

create policy "a shop owner manages fitments for their products"
  on public.product_fitments for all
  to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_fitments.product_id and public.owns_shop(p.shop_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_fitments.product_id and public.owns_shop(p.shop_id)
    )
  );

create policy "reviews are public"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "a signed-in buyer writes their own review"
  on public.reviews for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "a buyer edits their own review"
  on public.reviews for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Shop follows
-- ─────────────────────────────────────────────────────────────

create policy "a user sees their own follows"
  on public.shop_follows for select
  to authenticated
  using (follower_id = auth.uid() or public.owns_shop(shop_id));

create policy "a user manages their own follows"
  on public.shop_follows for all
  to authenticated
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Buyer-private data
-- ─────────────────────────────────────────────────────────────

create policy "a buyer owns their garage"
  on public.vehicles for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "a buyer owns their saved searches"
  on public.saved_searches for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────

create policy "an order is visible to its buyer and its shop"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or public.owns_shop(shop_id));

create policy "a buyer places their own orders"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid());

-- Only the shop moves an order along; buyers cannot mark their own delivered.
create policy "a shop owner updates its orders"
  on public.orders for update
  to authenticated
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

create policy "order items follow the order"
  on public.order_items for select
  to authenticated
  using (public.owns_order(order_id));

create policy "order items are written with the order"
  on public.order_items for insert
  to authenticated
  with check (public.owns_order(order_id));

create policy "order events follow the order"
  on public.order_events for select
  to authenticated
  using (public.owns_order(order_id));

-- Status events come from the shop; the opening `received` event is written
-- by place_order on the buyer's behalf.
create policy "order events are written by the shop or at checkout"
  on public.order_events for insert
  to authenticated
  with check (
    public.owns_shop((select shop_id from public.orders where orders.id = order_events.order_id))
    or (
      status = 'received'
      and exists (
        select 1 from public.orders o
        where o.id = order_events.order_id and o.buyer_id = auth.uid()
      )
    )
  );
