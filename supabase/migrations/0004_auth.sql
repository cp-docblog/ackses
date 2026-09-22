-- Auth support: profile creation on sign-up, and the write policies the
-- seller sign-up flow needs.
--
-- 0003 gave `sellers` select and update policies but no insert, because at
-- that point sellers only ever arrived through the seed. Now that an account
-- can open its own shop, it needs to create its own seller row.

-- ─────────────────────────────────────────────────────────────
-- Profile row per account
-- ─────────────────────────────────────────────────────────────

-- `full_name` is read out of the sign-up metadata the client sends in
-- `options.data`. Security definer because the row is created before the new
-- user has a session to satisfy the insert policy with.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Becoming a seller
-- ─────────────────────────────────────────────────────────────

-- An account may claim exactly one seller record, and only for itself.
create policy "an account creates its own seller record"
  on public.sellers for insert
  to authenticated
  with check (user_id = auth.uid());

-- Guards the one-seller-per-account rule at the database rather than relying
-- on the client checking first. `user_id` is already unique, but the partial
-- index makes the intent explicit and keeps nulls (seeded sellers) allowed.
create unique index if not exists sellers_one_per_user_idx
  on public.sellers (user_id)
  where user_id is not null;

-- ─────────────────────────────────────────────────────────────
-- Reset-password deep link
-- ─────────────────────────────────────────────────────────────

comment on function public.handle_new_user is
  'Creates public.profiles for every new auth.users row, copying full_name from sign-up metadata.';
