-- Hardening flagged by the Supabase security advisor on first deploy.
--
-- Supabase grants `anon` and `authenticated` EXECUTE on every new function by
-- default privilege, so 0003's `revoke ... from public` did not strip anon's
-- own grant. This closes that, pins search_path on the trust guards, and
-- moves pg_trgm out of the API-exposed schema.

-- The trigger function must never be callable over the REST RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Ownership helpers are for signed-in users only; anon has nothing to own.
revoke execute on function public.owns_shop(uuid) from anon;
revoke execute on function public.owns_order(uuid) from anon;

-- Pin search_path on the trust guards so a caller cannot shadow the tables
-- they read.
alter function public.is_privileged_writer() set search_path = public;
alter function public.guard_seller_trust_columns() set search_path = public;
alter function public.guard_shop_trust_columns() set search_path = public;

-- Extensions live outside the API-exposed schema.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
