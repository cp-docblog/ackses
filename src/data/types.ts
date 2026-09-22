/** Domain types shared by the Supabase repository and the demo fixtures. */

export type Condition = 'new' | 'used' | 'refurbished';

export type OrderStatus = 'received' | 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered';

/** Index into `t.statuses`, which is ordered to match `ORDER_STATUSES`. */
export const ORDER_STATUSES: OrderStatus[] = [
  'received',
  'preparing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  /** Masked in the UI; the design shows e.g. `4T1B11HK5JU1••••`. */
  vin?: string | null;
};

export type Seller = {
  id: string;
  name: { en: string; ar: string };
  initial: { en: string; ar: string };
  verified: boolean;
  memberSince: number;
  rating: number;
  ordersCount: number;
  responseTime: string;
  city: { en: string; ar: string };
};

export type Shop = {
  id: string;
  sellerId: string;
  name: { en: string; ar: string };
  initial: string;
  city: { en: string; ar: string };
  address: { en: string; ar: string };
  about: { en: string; ar: string };
  since: number;
  verified: boolean;
  rating: number;
  productCount: number;
  responseRate: number;
  followers: string;
  hours: string;
  deliveryFee: number;
};

export type Product = {
  id: string;
  shopId: string;
  name: { en: string; ar: string };
  oem: string;
  brand: string;
  /** Index into `t.cats`. */
  categoryIndex: number;
  /** Index into `t.subcats[categoryIndex]`, when the seller picked one. */
  subcategoryIndex?: number | null;
  condition: Condition;
  priceIqd: number;
  stock: number;
  /** Short label the placeholder tile prints until real photography lands. */
  imageLabel: string;
  imageUrl?: string | null;
  specs: { key: { en: string; ar: string }; value: { en: string; ar: string } }[];
  /** Vehicle ranges this part fits — drives the "Fits" badge. */
  fitments: { make: string; model: string; yearFrom: number; yearTo: number }[];
};

export type Review = {
  id: string;
  shopId: string;
  author: { en: string; ar: string };
  stars: number;
  text: { en: string; ar: string };
};

export type OrderItem = {
  productId: string;
  name: { en: string; ar: string };
  oem: string;
  condition: Condition;
  unitPriceIqd: number;
  qty: number;
};

export type Order = {
  id: string;
  reference: string;
  shopId: string;
  buyerName: { en: string; ar: string };
  city: { en: string; ar: string };
  status: OrderStatus;
  totalIqd: number;
  items: OrderItem[];
  /** ISO timestamps keyed by the status they mark. */
  timeline: Partial<Record<OrderStatus, string>>;
  paymentMethod: 'cod' | 'card';
};

export type SavedSearch = {
  id: string;
  query: { en: string; ar: string };
  meta: { en: string; ar: string };
  alertsEnabled: boolean;
};

/** The filter state that both the listings screen and the filter sheet read. */
export type ProductFilters = {
  text: string;
  /** -1 means "all categories". */
  categoryIndex: number;
  subcategory: string | null;
  /** Index into `t.conds`: 0 all, 1 new, 2 used. */
  conditionIndex: number;
  brand: string | null;
  city: string | null;
  /** Null means unbounded — the filter is off until the buyer types a number. */
  minPriceIqd: number | null;
  maxPriceIqd: number | null;
  fitsOnly: boolean;
  /** Set when `fitsOnly` is on. */
  vehicle: Vehicle | null;
};

/**
 * Bounds of the price slider track. These size the visual range readout only;
 * they are not applied as a filter, so a part priced outside them is still
 * listed until the buyer narrows the range themselves.
 */
export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 250_000;

export const defaultFilters: ProductFilters = {
  text: '',
  categoryIndex: -1,
  subcategory: null,
  conditionIndex: 0,
  brand: null,
  city: null,
  minPriceIqd: null,
  maxPriceIqd: null,
  fitsOnly: false,
  vehicle: null,
};

export const MAKES = ['Toyota', 'Kia', 'Hyundai', 'Nissan', 'Chevrolet', 'BMW'] as const;

export const MODELS: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'Land Cruiser', 'Hilux'],
  Kia: ['Sportage', 'Optima', 'Cerato', 'Sorento'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
  Nissan: ['Sunny', 'Altima', 'Patrol'],
  Chevrolet: ['Cruze', 'Malibu', 'Tahoe'],
  BMW: ['3 Series', '5 Series', 'X5'],
};

export const YEARS = [
  2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
];

export const BRANDS = ['Toyota Genuine', 'Brembo', 'Bosch', 'Denso', 'Mobis', 'TRW'] as const;

/** True when the part's fitment ranges cover the given vehicle. */
export function fitsVehicle(product: Product, vehicle: Vehicle | null): boolean {
  if (!vehicle) return false;
  return product.fitments.some(
    (f) =>
      f.make === vehicle.make &&
      f.model === vehicle.model &&
      vehicle.year >= f.yearFrom &&
      vehicle.year <= f.yearTo,
  );
}
