-- Beta test accounts. Run against the project as postgres (SQL editor or
-- psql). Idempotent. Not for production: the passwords are deliberately simple.
--
--   buyer@ackses.com  / buyer123
--   seller@ackses.com / seller123   (owns the seeded Al-Rafidain shop)

do $$
declare
  v_buyer  uuid := '11111111-0000-4000-8000-000000000001';
  v_seller uuid := '11111111-0000-4000-8000-000000000002';
begin
  -- Remove any earlier test identities so re-running gives a clean pair.
  delete from auth.users where id in (v_buyer, v_seller);

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current)
  values
    ('00000000-0000-0000-0000-000000000000', v_buyer, 'authenticated', 'authenticated',
     'buyer@ackses.com', crypt('buyer123', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Mustafa Al-Jabouri"}', now(), now(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_seller, 'authenticated', 'authenticated',
     'seller@ackses.com', crypt('seller123', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Haider Al-Rubaie"}', now(), now(), '', '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_buyer,  v_buyer::text,  jsonb_build_object('sub', v_buyer::text,  'email', 'buyer@ackses.com',  'email_verified', true), 'email', now(), now(), now()),
    (gen_random_uuid(), v_seller, v_seller::text, jsonb_build_object('sub', v_seller::text, 'email', 'seller@ackses.com', 'email_verified', true), 'email', now(), now(), now());

  update public.profiles set phone = '+9647701114412' where id = v_buyer;

  update public.sellers set user_id = v_seller where id = '00000000-0000-4000-8000-000000000101';

  delete from public.vehicles where owner_id = v_buyer;
  insert into public.vehicles (owner_id, make, model, year, vin) values
    (v_buyer, 'Toyota', 'Camry', 2018, '4T1B11HK5JU1••••'),
    (v_buyer, 'Kia', 'Sportage', 2021, 'KNDPM3AC3M7••••');

  delete from public.saved_searches where owner_id = v_buyer;
  insert into public.saved_searches (owner_id, query_en, query_ar, meta_en, meta_ar, alerts_enabled) values
    (v_buyer, 'Brake pads Camry 2018', 'فحمات فرامل كامري 2018', 'New · Baghdad · 3 new results', 'جديد · بغداد · 3 نتائج جديدة', true),
    (v_buyer, 'Used headlight LH', 'مصباح أمامي مستعمل', 'Used · any city', 'مستعمل · أي مدينة', false);

  update public.orders set buyer_id = v_buyer
    where id in ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000703');
end $$;
