-- Demo data for the ACKSES marketplace.
--
-- These rows mirror `src/data/fixtures.ts` exactly, ids included, so the app
-- shows the same catalogue whether or not Supabase is configured.
--
-- Not seeded: `vehicles` and `saved_searches` belong to a signed-in user and
-- are created the first time someone completes onboarding or saves a search.

-- ─────────────────────────────────────────────────────────────
-- Seller & shops
-- ─────────────────────────────────────────────────────────────

insert into public.sellers (
  id, name_en, name_ar, initial_en, initial_ar,
  verified, member_since, rating, orders_count, response_time, city_en, city_ar
) values (
  '00000000-0000-4000-8000-000000000101',
  'Haider Al-Rubaie', 'حيدر الربيعي', 'H', 'ح',
  true, 2019, 4.8, 3420, '< 1h', 'Baghdad', 'بغداد'
) on conflict (id) do nothing;

insert into public.shops (
  id, seller_id, name_en, name_ar, initial, city_en, city_ar,
  address_en, address_ar, about_en, about_ar,
  since, verified, rating, product_count, response_rate, followers, hours, delivery_fee_iqd
) values
(
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000101',
  'Al-Rafidain Auto Parts', 'الرافدين لقطع السيارات', 'R', 'Baghdad', 'بغداد',
  'Sinaa St., Baghdad', 'شارع الصناعة، بغداد',
  'Genuine and aftermarket parts for Japanese and Korean cars. Wholesale to workshops across Baghdad. Same-day delivery inside the city.',
  'قطع أصلية وتجارية للسيارات اليابانية والكورية. بيع جملة للورش في بغداد. توصيل بنفس اليوم داخل المدينة.',
  2019, true, 4.8, 312, 98, '2.1k', '9:00 – 21:00', 2500
),
(
  '00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000101',
  'Al-Rafidain — Erbil', 'الرافدين — أربيل', 'K', 'Erbil', 'أربيل',
  '60m Road, Erbil', 'طريق ٦٠ متر، أربيل',
  'Northern branch. Genuine parts, nationwide courier.',
  'الفرع الشمالي. قطع أصلية، توصيل لكل العراق.',
  2022, true, 4.7, 96, 95, '540', '9:00 – 20:00', 5000
) on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────

insert into public.products (
  id, shop_id, name_en, name_ar, oem, brand,
  category_position, subcategory_position, condition, price_iqd, stock, image_label, specs
) values
(
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000201',
  'Front brake pads set — ceramic', 'طقم فحمات فرامل أمامية — سيراميك',
  '04465-33471', 'Toyota Genuine', 0, 0, 'new', 45000, 12, 'brake pads',
  '[{"key":{"en":"Position","ar":"الموقع"},"value":{"en":"Front axle","ar":"المحور الأمامي"}},
    {"key":{"en":"Material","ar":"المادة"},"value":{"en":"Ceramic","ar":"سيراميك"}},
    {"key":{"en":"Warranty","ar":"الضمان"},"value":{"en":"12 months","ar":"12 شهر"}},
    {"key":{"en":"Weight","ar":"الوزن"},"value":{"en":"1.8 kg","ar":"1.8 كغ"}}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000201',
  'Front brake disc 305mm', 'قرص فرامل أمامي 305مم',
  '43512-06150', 'Brembo', 0, 1, 'new', 78000, 6, 'brake disc',
  '[{"key":{"en":"Diameter","ar":"القطر"},"value":{"en":"305 mm","ar":"305 مم"}},
    {"key":{"en":"Position","ar":"الموقع"},"value":{"en":"Front axle","ar":"المحور الأمامي"}},
    {"key":{"en":"Type","ar":"النوع"},"value":{"en":"Vented","ar":"مهوّى"}},
    {"key":{"en":"Warranty","ar":"الضمان"},"value":{"en":"12 months","ar":"12 شهر"}}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000201',
  'Engine oil filter', 'فلتر زيت المحرك',
  '90915-YZZD4', 'Denso', 2, 0, 'new', 9500, 40, 'oil filter',
  '[{"key":{"en":"Thread","ar":"السن"},"value":{"en":"M20 x 1.5","ar":"M20 x 1.5"}},
    {"key":{"en":"Height","ar":"الارتفاع"},"value":{"en":"85 mm","ar":"85 مم"}},
    {"key":{"en":"Warranty","ar":"الضمان"},"value":{"en":"6 months","ar":"6 أشهر"}}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000304',
  '00000000-0000-4000-8000-000000000201',
  'Headlight assembly LH (used)', 'مصباح أمامي يسار (مستعمل)',
  '81150-06C10', 'Toyota Genuine', 4, null, 'used', 165000, 1, 'headlight',
  '[{"key":{"en":"Side","ar":"الجهة"},"value":{"en":"Left","ar":"يسار"}},
    {"key":{"en":"Bulb","ar":"اللمبة"},"value":{"en":"LED","ar":"LED"}},
    {"key":{"en":"Condition","ar":"الحالة"},"value":{"en":"Used — no cracks","ar":"مستعمل — بدون كسور"}}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000201',
  'Cabin air filter', 'فلتر مكيف',
  '87139-0E040', 'Bosch', 2, 2, 'new', 12000, 25, 'cabin filter',
  '[{"key":{"en":"Type","ar":"النوع"},"value":{"en":"Activated carbon","ar":"كربون منشّط"}},
    {"key":{"en":"Length","ar":"الطول"},"value":{"en":"216 mm","ar":"216 مم"}},
    {"key":{"en":"Warranty","ar":"الضمان"},"value":{"en":"6 months","ar":"6 أشهر"}}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000306',
  '00000000-0000-4000-8000-000000000201',
  'Front shock absorber', 'مساعد أمامي',
  '48510-8Z296', 'TRW', 5, null, 'new', 96000, 4, 'shock absorber',
  '[{"key":{"en":"Position","ar":"الموقع"},"value":{"en":"Front axle","ar":"المحور الأمامي"}},
    {"key":{"en":"Type","ar":"النوع"},"value":{"en":"Gas","ar":"غاز"}},
    {"key":{"en":"Warranty","ar":"الضمان"},"value":{"en":"12 months","ar":"12 شهر"}}]'::jsonb
) on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Fitments — these drive the "Fits" badge and the my-car filter
-- ─────────────────────────────────────────────────────────────

insert into public.product_fitments (product_id, make, model, year_from, year_to) values
  ('00000000-0000-4000-8000-000000000301', 'Toyota', 'Camry',   2018, 2024),
  ('00000000-0000-4000-8000-000000000301', 'Toyota', 'Corolla', 2019, 2024),
  ('00000000-0000-4000-8000-000000000302', 'Toyota', 'Camry',   2018, 2024),
  ('00000000-0000-4000-8000-000000000303', 'Toyota', 'Camry',   2012, 2024),
  ('00000000-0000-4000-8000-000000000303', 'Toyota', 'Corolla', 2012, 2024),
  ('00000000-0000-4000-8000-000000000304', 'Toyota', 'Camry',   2015, 2017),
  ('00000000-0000-4000-8000-000000000305', 'Toyota', 'Camry',   2018, 2024),
  ('00000000-0000-4000-8000-000000000305', 'Kia',    'Sportage', 2019, 2024),
  ('00000000-0000-4000-8000-000000000306', 'Nissan', 'Altima',  2016, 2022)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Reviews
-- ─────────────────────────────────────────────────────────────

insert into public.reviews (id, shop_id, author_en, author_ar, stars, text_en, text_ar) values
(
  '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000201',
  'Ahmed K.', 'أحمد ك.', 5,
  'Original part, fit my Camry perfectly. Delivered next day in Karrada.',
  'قطعة أصلية وركبت على الكامري تمام. وصلت ثاني يوم للكرادة.'
),
(
  '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000201',
  'Sara M.', 'سارة م.', 4,
  'Good price. Packaging could be better.',
  'سعر جيد. التغليف يحتاج تحسين.'
),
(
  '00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000201',
  'Omar T.', 'عمر ت.', 5,
  'Fast replies, checked the VIN for me before shipping.',
  'رد سريع، تأكدوا من الشاصي قبل الشحن.'
) on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Orders — buyer_id is null until a real account claims them
-- ─────────────────────────────────────────────────────────────

insert into public.orders (
  id, reference, shop_id, buyer_name_en, buyer_name_ar,
  city_en, city_ar, status, total_iqd, payment_method
) values
(
  '00000000-0000-4000-8000-000000000701', 'AK-20931', '00000000-0000-4000-8000-000000000201',
  'Ali H.', 'علي ح.', 'Baghdad', 'بغداد', 'preparing', 90000, 'cod'
),
(
  '00000000-0000-4000-8000-000000000702', 'AK-20928', '00000000-0000-4000-8000-000000000201',
  'Noor S.', 'نور س.', 'Erbil', 'أربيل', 'received', 78000, 'cod'
),
(
  '00000000-0000-4000-8000-000000000703', 'AK-20910', '00000000-0000-4000-8000-000000000201',
  'Karrar M.', 'كرار م.', 'Baghdad', 'بغداد', 'delivered', 12000, 'cod'
) on conflict (id) do nothing;

insert into public.order_items (order_id, product_id, name_en, name_ar, oem, condition, unit_price_iqd, qty) values
(
  '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000301',
  'Front brake pads set — ceramic', 'طقم فحمات فرامل أمامية — سيراميك', '04465-33471', 'new', 45000, 2
),
(
  '00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000302',
  'Front brake disc 305mm', 'قرص فرامل أمامي 305مم', '43512-06150', 'new', 78000, 1
),
(
  '00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000305',
  'Cabin air filter', 'فلتر مكيف', '87139-0E040', 'new', 12000, 1
) on conflict do nothing;

insert into public.order_events (order_id, status, created_at) values
  ('00000000-0000-4000-8000-000000000701', 'received',         '2026-09-21T09:12:00Z'),
  ('00000000-0000-4000-8000-000000000701', 'preparing',        '2026-09-21T09:40:00Z'),
  ('00000000-0000-4000-8000-000000000702', 'received',         '2026-09-21T08:05:00Z'),
  ('00000000-0000-4000-8000-000000000703', 'received',         '2026-09-19T10:00:00Z'),
  ('00000000-0000-4000-8000-000000000703', 'preparing',        '2026-09-19T10:30:00Z'),
  ('00000000-0000-4000-8000-000000000703', 'shipped',          '2026-09-19T14:00:00Z'),
  ('00000000-0000-4000-8000-000000000703', 'out_for_delivery', '2026-09-20T09:00:00Z'),
  ('00000000-0000-4000-8000-000000000703', 'delivered',        '2026-09-20T13:20:00Z')
on conflict do nothing;

-- Keep the reference sequence ahead of the seeded order numbers.
select setval('public.order_reference_seq', 20940);
