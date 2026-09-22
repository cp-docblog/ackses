/**
 * Demo data, mirroring `supabase/seed.sql` row for row.
 *
 * The repository in `src/data/repository.ts` falls back to these whenever
 * Supabase credentials are absent, so the app is fully explorable before a
 * project is provisioned. Ids match the seed file's UUIDs.
 */
import type { Order, Product, Review, SavedSearch, Seller, Shop, Vehicle } from './types';

export const SELLER: Seller = {
  id: '00000000-0000-4000-8000-000000000101',
  name: { en: 'Haider Al-Rubaie', ar: 'حيدر الربيعي' },
  initial: { en: 'H', ar: 'ح' },
  verified: true,
  memberSince: 2019,
  rating: 4.8,
  ordersCount: 3420,
  responseTime: '< 1h',
  city: { en: 'Baghdad', ar: 'بغداد' },
};

export const SHOPS: Shop[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    sellerId: SELLER.id,
    name: { en: 'Al-Rafidain Auto Parts', ar: 'الرافدين لقطع السيارات' },
    initial: 'R',
    city: { en: 'Baghdad', ar: 'بغداد' },
    address: { en: 'Sinaa St., Baghdad', ar: 'شارع الصناعة، بغداد' },
    about: {
      en: 'Genuine and aftermarket parts for Japanese and Korean cars. Wholesale to workshops across Baghdad. Same-day delivery inside the city.',
      ar: 'قطع أصلية وتجارية للسيارات اليابانية والكورية. بيع جملة للورش في بغداد. توصيل بنفس اليوم داخل المدينة.',
    },
    since: 2019,
    verified: true,
    rating: 4.8,
    productCount: 312,
    responseRate: 98,
    followers: '2.1k',
    hours: '9:00 – 21:00',
    deliveryFee: 2500,
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    sellerId: SELLER.id,
    name: { en: 'Al-Rafidain — Erbil', ar: 'الرافدين — أربيل' },
    initial: 'K',
    city: { en: 'Erbil', ar: 'أربيل' },
    address: { en: '60m Road, Erbil', ar: 'طريق ٦٠ متر، أربيل' },
    about: {
      en: 'Northern branch. Genuine parts, nationwide courier.',
      ar: 'الفرع الشمالي. قطع أصلية، توصيل لكل العراق.',
    },
    since: 2022,
    verified: true,
    rating: 4.7,
    productCount: 96,
    responseRate: 95,
    followers: '540',
    hours: '9:00 – 20:00',
    deliveryFee: 5000,
  },
];

const MAIN_SHOP = SHOPS[0].id;

export const PRODUCTS: Product[] = [
  {
    id: '00000000-0000-4000-8000-000000000301',
    shopId: MAIN_SHOP,
    name: { en: 'Front brake pads set — ceramic', ar: 'طقم فحمات فرامل أمامية — سيراميك' },
    oem: '04465-33471',
    brand: 'Toyota Genuine',
    categoryIndex: 0,
    subcategoryIndex: 0,
    condition: 'new',
    priceIqd: 45000,
    stock: 12,
    imageLabel: 'brake pads',
    specs: [
      { key: { en: 'Position', ar: 'الموقع' }, value: { en: 'Front axle', ar: 'المحور الأمامي' } },
      { key: { en: 'Material', ar: 'المادة' }, value: { en: 'Ceramic', ar: 'سيراميك' } },
      { key: { en: 'Warranty', ar: 'الضمان' }, value: { en: '12 months', ar: '12 شهر' } },
      { key: { en: 'Weight', ar: 'الوزن' }, value: { en: '1.8 kg', ar: '1.8 كغ' } },
    ],
    fitments: [
      { make: 'Toyota', model: 'Camry', yearFrom: 2018, yearTo: 2024 },
      { make: 'Toyota', model: 'Corolla', yearFrom: 2019, yearTo: 2024 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000302',
    shopId: MAIN_SHOP,
    name: { en: 'Front brake disc 305mm', ar: 'قرص فرامل أمامي 305مم' },
    oem: '43512-06150',
    brand: 'Brembo',
    categoryIndex: 0,
    subcategoryIndex: 1,
    condition: 'new',
    priceIqd: 78000,
    stock: 6,
    imageLabel: 'brake disc',
    specs: [
      { key: { en: 'Diameter', ar: 'القطر' }, value: { en: '305 mm', ar: '305 مم' } },
      { key: { en: 'Position', ar: 'الموقع' }, value: { en: 'Front axle', ar: 'المحور الأمامي' } },
      { key: { en: 'Type', ar: 'النوع' }, value: { en: 'Vented', ar: 'مهوّى' } },
      { key: { en: 'Warranty', ar: 'الضمان' }, value: { en: '12 months', ar: '12 شهر' } },
    ],
    fitments: [{ make: 'Toyota', model: 'Camry', yearFrom: 2018, yearTo: 2024 }],
  },
  {
    id: '00000000-0000-4000-8000-000000000303',
    shopId: MAIN_SHOP,
    name: { en: 'Engine oil filter', ar: 'فلتر زيت المحرك' },
    oem: '90915-YZZD4',
    brand: 'Denso',
    categoryIndex: 2,
    subcategoryIndex: 0,
    condition: 'new',
    priceIqd: 9500,
    stock: 40,
    imageLabel: 'oil filter',
    specs: [
      { key: { en: 'Thread', ar: 'السن' }, value: { en: 'M20 x 1.5', ar: 'M20 x 1.5' } },
      { key: { en: 'Height', ar: 'الارتفاع' }, value: { en: '85 mm', ar: '85 مم' } },
      { key: { en: 'Warranty', ar: 'الضمان' }, value: { en: '6 months', ar: '6 أشهر' } },
    ],
    fitments: [
      { make: 'Toyota', model: 'Camry', yearFrom: 2012, yearTo: 2024 },
      { make: 'Toyota', model: 'Corolla', yearFrom: 2012, yearTo: 2024 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000304',
    shopId: MAIN_SHOP,
    name: { en: 'Headlight assembly LH (used)', ar: 'مصباح أمامي يسار (مستعمل)' },
    oem: '81150-06C10',
    brand: 'Toyota Genuine',
    categoryIndex: 4,
    condition: 'used',
    priceIqd: 165000,
    stock: 1,
    imageLabel: 'headlight',
    specs: [
      { key: { en: 'Side', ar: 'الجهة' }, value: { en: 'Left', ar: 'يسار' } },
      { key: { en: 'Bulb', ar: 'اللمبة' }, value: { en: 'LED', ar: 'LED' } },
      { key: { en: 'Condition', ar: 'الحالة' }, value: { en: 'Used — no cracks', ar: 'مستعمل — بدون كسور' } },
    ],
    fitments: [{ make: 'Toyota', model: 'Camry', yearFrom: 2015, yearTo: 2017 }],
  },
  {
    id: '00000000-0000-4000-8000-000000000305',
    shopId: MAIN_SHOP,
    name: { en: 'Cabin air filter', ar: 'فلتر مكيف' },
    oem: '87139-0E040',
    brand: 'Bosch',
    categoryIndex: 2,
    subcategoryIndex: 2,
    condition: 'new',
    priceIqd: 12000,
    stock: 25,
    imageLabel: 'cabin filter',
    specs: [
      { key: { en: 'Type', ar: 'النوع' }, value: { en: 'Activated carbon', ar: 'كربون منشّط' } },
      { key: { en: 'Length', ar: 'الطول' }, value: { en: '216 mm', ar: '216 مم' } },
      { key: { en: 'Warranty', ar: 'الضمان' }, value: { en: '6 months', ar: '6 أشهر' } },
    ],
    fitments: [
      { make: 'Toyota', model: 'Camry', yearFrom: 2018, yearTo: 2024 },
      { make: 'Kia', model: 'Sportage', yearFrom: 2019, yearTo: 2024 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000306',
    shopId: MAIN_SHOP,
    name: { en: 'Front shock absorber', ar: 'مساعد أمامي' },
    oem: '48510-8Z296',
    brand: 'TRW',
    categoryIndex: 5,
    condition: 'new',
    priceIqd: 96000,
    stock: 4,
    imageLabel: 'shock absorber',
    specs: [
      { key: { en: 'Position', ar: 'الموقع' }, value: { en: 'Front axle', ar: 'المحور الأمامي' } },
      { key: { en: 'Type', ar: 'النوع' }, value: { en: 'Gas', ar: 'غاز' } },
      { key: { en: 'Warranty', ar: 'الضمان' }, value: { en: '12 months', ar: '12 شهر' } },
    ],
    fitments: [{ make: 'Nissan', model: 'Altima', yearFrom: 2016, yearTo: 2022 }],
  },
];

export const REVIEWS: Review[] = [
  {
    id: '00000000-0000-4000-8000-000000000401',
    shopId: MAIN_SHOP,
    author: { en: 'Ahmed K.', ar: 'أحمد ك.' },
    stars: 5,
    text: {
      en: 'Original part, fit my Camry perfectly. Delivered next day in Karrada.',
      ar: 'قطعة أصلية وركبت على الكامري تمام. وصلت ثاني يوم للكرادة.',
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000402',
    shopId: MAIN_SHOP,
    author: { en: 'Sara M.', ar: 'سارة م.' },
    stars: 4,
    text: { en: 'Good price. Packaging could be better.', ar: 'سعر جيد. التغليف يحتاج تحسين.' },
  },
  {
    id: '00000000-0000-4000-8000-000000000403',
    shopId: MAIN_SHOP,
    author: { en: 'Omar T.', ar: 'عمر ت.' },
    stars: 5,
    text: {
      en: 'Fast replies, checked the VIN for me before shipping.',
      ar: 'رد سريع، تأكدوا من الشاصي قبل الشحن.',
    },
  },
];

export const GARAGE: Vehicle[] = [
  {
    id: '00000000-0000-4000-8000-000000000501',
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    vin: '4T1B11HK5JU1••••',
  },
  {
    id: '00000000-0000-4000-8000-000000000502',
    make: 'Kia',
    model: 'Sportage',
    year: 2021,
    vin: 'KNDPM3AC3M7••••',
  },
];

export const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: '00000000-0000-4000-8000-000000000601',
    query: { en: 'Brake pads Camry 2018', ar: 'فحمات فرامل كامري 2018' },
    meta: { en: 'New · Baghdad · 3 new results', ar: 'جديد · بغداد · 3 نتائج جديدة' },
    alertsEnabled: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000602',
    query: { en: 'Used headlight LH', ar: 'مصباح أمامي مستعمل' },
    meta: { en: 'Used · any city', ar: 'مستعمل · أي مدينة' },
    alertsEnabled: false,
  },
];

export const ORDERS: Order[] = [
  {
    id: '00000000-0000-4000-8000-000000000701',
    reference: 'AK-20931',
    shopId: MAIN_SHOP,
    buyerName: { en: 'Ali H.', ar: 'علي ح.' },
    city: { en: 'Baghdad', ar: 'بغداد' },
    status: 'preparing',
    totalIqd: 90000,
    paymentMethod: 'cod',
    items: [
      {
        productId: PRODUCTS[0].id,
        name: PRODUCTS[0].name,
        oem: PRODUCTS[0].oem,
        condition: 'new',
        unitPriceIqd: 45000,
        qty: 2,
      },
    ],
    timeline: {
      received: '2026-09-21T09:12:00Z',
      preparing: '2026-09-21T09:40:00Z',
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000702',
    reference: 'AK-20928',
    shopId: MAIN_SHOP,
    buyerName: { en: 'Noor S.', ar: 'نور س.' },
    city: { en: 'Erbil', ar: 'أربيل' },
    status: 'received',
    totalIqd: 78000,
    paymentMethod: 'cod',
    items: [
      {
        productId: PRODUCTS[1].id,
        name: PRODUCTS[1].name,
        oem: PRODUCTS[1].oem,
        condition: 'new',
        unitPriceIqd: 78000,
        qty: 1,
      },
    ],
    timeline: { received: '2026-09-21T08:05:00Z' },
  },
  {
    id: '00000000-0000-4000-8000-000000000703',
    reference: 'AK-20910',
    shopId: MAIN_SHOP,
    buyerName: { en: 'Karrar M.', ar: 'كرار م.' },
    city: { en: 'Baghdad', ar: 'بغداد' },
    status: 'delivered',
    totalIqd: 12000,
    paymentMethod: 'cod',
    items: [
      {
        productId: PRODUCTS[4].id,
        name: PRODUCTS[4].name,
        oem: PRODUCTS[4].oem,
        condition: 'new',
        unitPriceIqd: 12000,
        qty: 1,
      },
    ],
    timeline: {
      received: '2026-09-19T10:00:00Z',
      preparing: '2026-09-19T10:30:00Z',
      shipped: '2026-09-19T14:00:00Z',
      out_for_delivery: '2026-09-20T09:00:00Z',
      delivered: '2026-09-20T13:20:00Z',
    },
  },
];

/** Orders the demo buyer placed, as shown on the buyer profile. */
export const BUYER_ORDERS: Order[] = [
  ORDERS[0],
  {
    ...ORDERS[2],
    id: '00000000-0000-4000-8000-000000000704',
    reference: 'AK-20877',
    totalIqd: 9500,
    items: [
      {
        productId: PRODUCTS[2].id,
        name: PRODUCTS[2].name,
        oem: PRODUCTS[2].oem,
        condition: 'new',
        unitPriceIqd: 9500,
        qty: 1,
      },
    ],
  },
];

export const SELLER_BALANCE = {
  availableIqd: 2840000,
  sales30dIqd: 4200000,
  ordersCount: 128,
  rating: 4.8,
};
