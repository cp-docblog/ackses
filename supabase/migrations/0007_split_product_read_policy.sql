-- 0006 revoked anon's EXECUTE on owns_shop(), but the anon-facing product
-- read policy from 0003 calls owns_shop() in its USING clause, so every guest
-- search started failing with "permission denied for function owns_shop".
--
-- A policy's predicate runs with the querying role's privileges, so anything
-- anon must evaluate cannot reference a function anon may not call. Split the
-- policy: guests get the plain visibility rule, and the owner branch lives on
-- an authenticated-only policy.

drop policy "listed products are public" on public.products;

create policy "listed products are public"
  on public.products for select
  to anon
  using (deleted_at is null);

create policy "a shop owner also sees their removed products"
  on public.products for select
  to authenticated
  using (deleted_at is null or public.owns_shop(shop_id));
