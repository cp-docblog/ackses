/**
 * Single data API for the app.
 *
 * When Supabase credentials are present every call goes to the database
 * (product search runs through the `search_products` RPC defined in
 * `supabase/migrations/0002_search.sql`). Otherwise the same call is served
 * from `src/data/fixtures.ts`, which mirrors `supabase/seed.sql`. The two
 * paths are kept semantically identical — if you change the filter rules in
 * one, change them in the other.
 */
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';
import {
  BUYER_ORDERS,
  GARAGE,
  ORDERS,
  PAYOUTS,
  PRODUCTS,
  PROFILE,
  REVIEWS,
  SAVED_SEARCHES,
  SELLER,
  SHOPS,
} from './fixtures';
import {
  fitsVehicle,
  type Address,
  type Condition,
  type NotificationPrefs,
  type Order,
  type OrderStatus,
  type Payout,
  type PayoutMethod,
  type Product,
  type ProductFilters,
  type Profile,
  type Review,
  type SavedSearch,
  type Seller,
  type Shop,
  type Vehicle,
} from './types';

/** A product plus whether it fits the vehicle the query was scoped to. */
export type ProductWithFit = Product & { fits: boolean };

/** The shop that the signed-in seller manages. In the demo, the first one. */
export const DEMO_SHOP_ID = SHOPS[0].id;

// ─────────────────────────────────────────────────────────────
// Row mapping (Supabase → domain)
// ─────────────────────────────────────────────────────────────

type ProductRow = {
  id: string;
  shop_id: string;
  name_en: string;
  name_ar: string;
  oem: string;
  brand: string;
  category_position: number;
  subcategory_position: number | null;
  condition: Condition;
  price_iqd: number;
  stock: number;
  image_label: string;
  image_url: string | null;
  specs: Product['specs'] | null;
  fitments: Product['fitments'] | null;
  fits?: boolean;
  bulk_tiers?: Product['bulkTiers'] | null;
  description?: string | null;
  delivery_option?: number | null;
  image_urls?: string[] | null;
};

function toProduct(row: ProductRow): ProductWithFit {
  return {
    id: row.id,
    shopId: row.shop_id,
    name: { en: row.name_en, ar: row.name_ar },
    oem: row.oem,
    brand: row.brand,
    categoryIndex: row.category_position,
    subcategoryIndex: row.subcategory_position,
    condition: row.condition,
    priceIqd: row.price_iqd,
    stock: row.stock,
    imageLabel: row.image_label,
    imageUrl: row.image_url,
    specs: row.specs ?? [],
    fitments: row.fitments ?? [],
    fits: row.fits ?? false,
    bulkTiers: row.bulk_tiers ?? [],
    description: row.description ?? '',
    deliveryOption: row.delivery_option ?? 0,
    imageUrls: row.image_urls ?? (row.image_url ? [row.image_url] : []),
  };
}

// ─────────────────────────────────────────────────────────────
// Filtering (shared semantics with search_products)
// ─────────────────────────────────────────────────────────────

const CONDITION_BY_INDEX: (Condition | null)[] = [null, 'new', 'used'];

function matchesLocally(
  product: Product,
  filters: ProductFilters,
  subcategoryPosition: number | null,
): boolean {
  const text = filters.text.trim().toLowerCase();
  if (text) {
    const haystack = [
      product.name.en,
      product.name.ar,
      product.oem,
      product.brand,
    ]
      .join(' ')
      .toLowerCase();
    // OEM numbers are often typed without the dash.
    if (!haystack.includes(text) && !haystack.replace(/-/g, '').includes(text.replace(/-/g, ''))) {
      return false;
    }
  }
  if (filters.categoryIndex >= 0 && product.categoryIndex !== filters.categoryIndex) return false;
  if (subcategoryPosition !== null && product.subcategoryIndex !== subcategoryPosition) return false;

  const condition = CONDITION_BY_INDEX[filters.conditionIndex] ?? null;
  if (condition && product.condition !== condition) return false;

  if (filters.brand && product.brand !== filters.brand) return false;
  if (filters.minPriceIqd !== null && product.priceIqd < filters.minPriceIqd) return false;
  if (filters.maxPriceIqd !== null && product.priceIqd > filters.maxPriceIqd) return false;

  if (filters.city) {
    const shop = SHOPS.find((s) => s.id === product.shopId);
    if (!shop || (shop.city.en !== filters.city && shop.city.ar !== filters.city)) return false;
  }

  if (filters.fitsOnly && !fitsVehicle(product, filters.vehicle)) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────

export async function searchProducts(
  filters: ProductFilters,
  subcategoryPosition: number | null,
): Promise<ProductWithFit[]> {
  if (!isSupabaseConfigured) {
    return PRODUCTS.filter((p) => matchesLocally(p, filters, subcategoryPosition)).map((p) => ({
      ...p,
      fits: fitsVehicle(p, filters.vehicle),
    }));
  }

  const { data, error } = await requireSupabase().rpc('search_products', {
    p_text: filters.text.trim() || null,
    p_category_position: filters.categoryIndex >= 0 ? filters.categoryIndex : null,
    p_subcategory_position: subcategoryPosition,
    p_condition: CONDITION_BY_INDEX[filters.conditionIndex] ?? null,
    p_brand: filters.brand,
    p_city: filters.city,
    p_min_price: filters.minPriceIqd,
    p_max_price: filters.maxPriceIqd,
    p_fits_only: filters.fitsOnly,
    p_make: filters.vehicle?.make ?? null,
    p_model: filters.vehicle?.model ?? null,
    p_year: filters.vehicle?.year ?? null,
  });

  if (error) throw error;
  return (data as ProductRow[]).map(toProduct);
}

export async function getProduct(id: string, vehicle: Vehicle | null): Promise<ProductWithFit> {
  if (!isSupabaseConfigured) {
    const product = PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
    return { ...product, fits: fitsVehicle(product, vehicle) };
  }

  const { data, error } = await requireSupabase()
    .from('products_with_fitments')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  const product = toProduct(data as ProductRow);
  return { ...product, fits: fitsVehicle(product, vehicle) };
}

export async function listShopProducts(
  shopId: string,
  vehicle: Vehicle | null,
): Promise<ProductWithFit[]> {
  if (!isSupabaseConfigured) {
    return PRODUCTS.filter((p) => p.shopId === shopId).map((p) => ({
      ...p,
      fits: fitsVehicle(p, vehicle),
    }));
  }

  const { data, error } = await requireSupabase()
    .from('products_with_fitments')
    .select('*')
    .eq('shop_id', shopId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ProductRow[]).map(toProduct).map((p) => ({ ...p, fits: fitsVehicle(p, vehicle) }));
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const index = PRODUCTS.findIndex((p) => p.id === id);
    if (index >= 0) PRODUCTS.splice(index, 1);
    return;
  }
  // Soft delete: orders reference the product, so the row has to survive.
  const { error } = await requireSupabase()
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export type NewProduct = {
  shopId: string;
  name: { en: string; ar: string };
  oem: string;
  brand: string;
  categoryIndex: number;
  subcategoryIndex: number | null;
  condition: Condition;
  priceIqd: number;
  stock: number;
  description: string;
  deliveryOptionIndex: number;
  fitments: Product['fitments'];
  imageUris: string[];
  bulkTiers: Product['bulkTiers'];
};

/**
 * Pushes local photo URIs into the `product-photos` bucket and returns their
 * public URLs. Files are keyed under the signed-in user's folder, which is
 * what the storage policy checks. On fixtures the local URIs pass through.
 */
export async function uploadProductPhotos(uris: string[]): Promise<string[]> {
  if (!isSupabaseConfigured || uris.length === 0) return uris;
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  const owner = auth.user?.id;
  if (!owner) throw new Error('Not signed in');

  const urls: string[] = [];
  for (const uri of uris) {
    if (/^https?:/.test(uri)) {
      urls.push(uri);
      continue;
    }
    const response = await fetch(uri);
    const bytes = await response.arrayBuffer();
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const path = `${owner}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const { error } = await db.storage.from('product-photos').upload(path, bytes, { contentType, upsert: false });
    if (error) throw error;
    urls.push(db.storage.from('product-photos').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

export async function createProduct(input: NewProduct): Promise<string> {
  if (!isSupabaseConfigured) {
    const id = `local-${Date.now()}`;
    PRODUCTS.unshift({
      id,
      shopId: input.shopId,
      name: input.name,
      oem: input.oem,
      brand: input.brand,
      categoryIndex: input.categoryIndex,
      subcategoryIndex: input.subcategoryIndex,
      condition: input.condition,
      priceIqd: input.priceIqd,
      stock: input.stock,
      imageLabel: input.name.en.toLowerCase().slice(0, 18),
      imageUrl: input.imageUris[0] ?? null,
      imageUrls: input.imageUris,
      specs: [],
      fitments: input.fitments,
      bulkTiers: input.bulkTiers,
      description: input.description,
      deliveryOption: input.deliveryOptionIndex,
    });
    return id;
  }

  const db = requireSupabase();
  const urls = await uploadProductPhotos(input.imageUris);
  const { data, error } = await db
    .from('products')
    .insert({
      shop_id: input.shopId,
      name_en: input.name.en,
      name_ar: input.name.ar,
      oem: input.oem,
      brand: input.brand,
      category_position: input.categoryIndex,
      subcategory_position: input.subcategoryIndex,
      condition: input.condition,
      price_iqd: input.priceIqd,
      stock: input.stock,
      image_label: input.name.en.toLowerCase().slice(0, 18),
      image_url: urls[0] ?? null,
      image_urls: urls,
      description: input.description,
      delivery_option: input.deliveryOptionIndex,
      bulk_tiers: input.bulkTiers ?? [],
      specs: [],
    })
    .select('id')
    .single();

  if (error) throw error;
  const productId = (data as { id: string }).id;

  if (input.fitments.length) {
    const { error: fitError } = await db.from('product_fitments').insert(
      input.fitments.map((f) => ({
        product_id: productId,
        make: f.make,
        model: f.model,
        year_from: f.yearFrom,
        year_to: f.yearTo,
      })),
    );
    if (fitError) throw fitError;
  }

  return productId;
}

export async function updateProduct(id: string, input: NewProduct): Promise<void> {
  if (!isSupabaseConfigured) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) {
      Object.assign(product, {
        name: input.name,
        oem: input.oem,
        brand: input.brand,
        categoryIndex: input.categoryIndex,
        subcategoryIndex: input.subcategoryIndex,
        condition: input.condition,
        priceIqd: input.priceIqd,
        stock: input.stock,
        fitments: input.fitments,
        bulkTiers: input.bulkTiers,
        description: input.description,
        deliveryOption: input.deliveryOptionIndex,
        imageUrls: input.imageUris,
        imageUrl: input.imageUris[0] ?? null,
      });
    }
    return;
  }
  const db = requireSupabase();
  const urls = await uploadProductPhotos(input.imageUris);
  const { error } = await db
    .from('products')
    .update({
      name_en: input.name.en,
      name_ar: input.name.ar,
      oem: input.oem,
      brand: input.brand,
      category_position: input.categoryIndex,
      subcategory_position: input.subcategoryIndex,
      condition: input.condition,
      price_iqd: input.priceIqd,
      stock: input.stock,
      image_url: urls[0] ?? null,
      image_urls: urls,
      description: input.description,
      delivery_option: input.deliveryOptionIndex,
      bulk_tiers: input.bulkTiers ?? [],
    })
    .eq('id', id);
  if (error) throw error;

  // Fitments are replaced wholesale; the set is small and the form edits it as one.
  const { error: clearError } = await db.from('product_fitments').delete().eq('product_id', id);
  if (clearError) throw clearError;
  if (input.fitments.length) {
    const { error: fitError } = await db.from('product_fitments').insert(
      input.fitments.map((f) => ({ product_id: id, make: f.make, model: f.model, year_from: f.yearFrom, year_to: f.yearTo })),
    );
    if (fitError) throw fitError;
  }
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  city_en: string;
  city_ar: string;
  addresses: Address[] | null;
  notification_prefs: NotificationPrefs | null;
  payment_preference: 'cod' | 'card' | null;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    city: { en: row.city_en, ar: row.city_ar },
    addresses: row.addresses ?? [],
    notificationPrefs: row.notification_prefs ?? { orders: true, alerts: true, marketing: false },
    paymentPreference: row.payment_preference ?? 'cod',
  };
}

export async function getProfile(): Promise<Profile> {
  if (!isSupabaseConfigured) return PROFILE;
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { data, error } = await db.from('profiles').select('*').eq('id', auth.user.id).single();
  if (error) throw error;
  return toProfile(data as ProfileRow);
}

export async function updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<void> {
  if (!isSupabaseConfigured) {
    Object.assign(PROFILE, patch);
    return;
  }
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.city) {
    row.city_en = patch.city.en;
    row.city_ar = patch.city.ar;
  }
  if (patch.addresses) row.addresses = patch.addresses;
  if (patch.notificationPrefs) row.notification_prefs = patch.notificationPrefs;
  if (patch.paymentPreference) row.payment_preference = patch.paymentPreference;
  const { error } = await db.from('profiles').update(row).eq('id', auth.user.id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Follows
// ─────────────────────────────────────────────────────────────

const localFollows = new Set<string>();

export async function isFollowingShop(shopId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return localFollows.has(shopId);
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await db
    .from('shop_follows')
    .select('shop_id')
    .eq('shop_id', shopId)
    .eq('follower_id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function setFollowingShop(shopId: string, following: boolean): Promise<void> {
  if (!isSupabaseConfigured) {
    if (following) localFollows.add(shopId);
    else localFollows.delete(shopId);
    return;
  }
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = following
    ? await db.from('shop_follows').upsert({ shop_id: shopId, follower_id: auth.user.id })
    : await db.from('shop_follows').delete().eq('shop_id', shopId).eq('follower_id', auth.user.id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Seller-side: shop, contact, payouts
// ─────────────────────────────────────────────────────────────

export type ShopPatch = Partial<Pick<Shop, 'name' | 'city' | 'address' | 'about' | 'hours' | 'deliveryFee' | 'phone'>>;

export async function updateShop(id: string, patch: ShopPatch): Promise<void> {
  if (!isSupabaseConfigured) {
    const shop = SHOPS.find((s) => s.id === id);
    if (shop) Object.assign(shop, patch);
    return;
  }
  const row: Record<string, unknown> = {};
  if (patch.name) {
    row.name_en = patch.name.en;
    row.name_ar = patch.name.ar;
    row.initial = patch.name.en.charAt(0).toUpperCase();
  }
  if (patch.city) {
    row.city_en = patch.city.en;
    row.city_ar = patch.city.ar;
  }
  if (patch.address) {
    row.address_en = patch.address.en;
    row.address_ar = patch.address.ar;
  }
  if (patch.about) {
    row.about_en = patch.about.en;
    row.about_ar = patch.about.ar;
  }
  if (patch.hours !== undefined) row.hours = patch.hours;
  if (patch.deliveryFee !== undefined) row.delivery_fee_iqd = patch.deliveryFee;
  if (patch.phone !== undefined) row.phone = patch.phone;
  const { error } = await requireSupabase().from('shops').update(row).eq('id', id);
  if (error) throw error;
}

export async function updateSellerContact(
  sellerId: string,
  patch: { phone?: string | null; whatsapp?: string | null; payoutMethod?: PayoutMethod | null },
): Promise<void> {
  if (!isSupabaseConfigured) {
    Object.assign(SELLER, patch);
    return;
  }
  const row: Record<string, unknown> = {};
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.payoutMethod !== undefined) row.payout_method = patch.payoutMethod ?? {};
  const { error } = await requireSupabase().from('sellers').update(row).eq('id', sellerId);
  if (error) throw error;
}

export async function listPayouts(sellerId: string): Promise<Payout[]> {
  if (!isSupabaseConfigured) return PAYOUTS;
  const { data, error } = await requireSupabase()
    .from('payouts')
    .select('id, amount_iqd, status, created_at')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as { id: string; amount_iqd: number; status: Payout['status']; created_at: string }[]).map((r) => ({
    id: r.id,
    amountIqd: r.amount_iqd,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function requestPayout(sellerId: string, amountIqd: number, method: PayoutMethod): Promise<void> {
  if (!isSupabaseConfigured) {
    PAYOUTS.unshift({ id: `local-${Date.now()}`, amountIqd, status: 'pending', createdAt: new Date().toISOString() });
    return;
  }
  const { error } = await requireSupabase()
    .from('payouts')
    .insert({ seller_id: sellerId, amount_iqd: amountIqd, method, status: 'pending' });
  if (error) throw error;
}

export async function createReport(sellerId: string, reason: string, details: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase().from('reports').insert({ seller_id: sellerId, reason, details });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Shops & sellers
// ─────────────────────────────────────────────────────────────

type ShopRow = {
  id: string;
  seller_id: string;
  name_en: string;
  name_ar: string;
  initial: string;
  city_en: string;
  city_ar: string;
  address_en: string;
  address_ar: string;
  about_en: string;
  about_ar: string;
  since: number;
  verified: boolean;
  rating: number;
  product_count: number;
  response_rate: number;
  followers: string;
  hours: string;
  delivery_fee_iqd: number;
  phone?: string | null;
};

function toShop(row: ShopRow): Shop {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: { en: row.name_en, ar: row.name_ar },
    initial: row.initial,
    city: { en: row.city_en, ar: row.city_ar },
    address: { en: row.address_en, ar: row.address_ar },
    about: { en: row.about_en, ar: row.about_ar },
    since: row.since,
    verified: row.verified,
    rating: Number(row.rating),
    productCount: row.product_count,
    responseRate: row.response_rate,
    followers: row.followers,
    hours: row.hours,
    deliveryFee: row.delivery_fee_iqd,
    phone: row.phone ?? null,
  };
}

export async function getShop(id: string): Promise<Shop> {
  if (!isSupabaseConfigured) return SHOPS.find((s) => s.id === id) ?? SHOPS[0];
  const { data, error } = await requireSupabase().from('shops').select('*').eq('id', id).single();
  if (error) throw error;
  return toShop(data as ShopRow);
}

export async function listSellerShops(sellerId: string): Promise<Shop[]> {
  if (!isSupabaseConfigured) return SHOPS.filter((s) => s.sellerId === sellerId);
  const { data, error } = await requireSupabase()
    .from('shops')
    .select('*')
    .eq('seller_id', sellerId)
    .order('since');
  if (error) throw error;
  return (data as ShopRow[]).map(toShop);
}

export async function getSeller(id: string): Promise<Seller> {
  if (!isSupabaseConfigured) return SELLER;
  const { data, error } = await requireSupabase().from('sellers').select('*').eq('id', id).single();
  if (error) throw error;
  const row = data as Record<string, never> & {
    id: string;
    name_en: string;
    name_ar: string;
    initial_en: string;
    initial_ar: string;
    verified: boolean;
    member_since: number;
    rating: number;
    orders_count: number;
    response_time: string;
    city_en: string;
    city_ar: string;
    phone?: string | null;
    whatsapp?: string | null;
    payout_method?: PayoutMethod | Record<string, never> | null;
  };
  const payout = row.payout_method && 'kind' in row.payout_method ? (row.payout_method as PayoutMethod) : null;
  return {
    id: row.id,
    name: { en: row.name_en, ar: row.name_ar },
    initial: { en: row.initial_en, ar: row.initial_ar },
    verified: row.verified,
    memberSince: row.member_since,
    rating: Number(row.rating),
    ordersCount: row.orders_count,
    responseTime: row.response_time,
    city: { en: row.city_en, ar: row.city_ar },
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    payoutMethod: payout,
  };
}

export async function listShopReviews(shopId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return REVIEWS.filter((r) => r.shopId === shopId);
  const { data, error } = await requireSupabase()
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (
    data as {
      id: string;
      shop_id: string;
      author_en: string;
      author_ar: string;
      stars: number;
      text_en: string;
      text_ar: string;
    }[]
  ).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    author: { en: row.author_en, ar: row.author_ar },
    stars: row.stars,
    text: { en: row.text_en, ar: row.text_ar },
  }));
}

// ─────────────────────────────────────────────────────────────
// Garage & saved searches
// ─────────────────────────────────────────────────────────────

export async function listGarage(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured) return GARAGE;
  const { data, error } = await requireSupabase()
    .from('vehicles')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data as { id: string; make: string; model: string; year: number; vin: string | null }[]).map(
    (row) => ({ id: row.id, make: row.make, model: row.model, year: row.year, vin: row.vin }),
  );
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  if (!isSupabaseConfigured) {
    const created = { ...vehicle, id: `local-${Date.now()}` };
    GARAGE.push(created);
    return created;
  }
  const { data, error } = await requireSupabase()
    .from('vehicles')
    .insert({ make: vehicle.make, model: vehicle.model, year: vehicle.year, vin: vehicle.vin })
    .select('*')
    .single();
  if (error) throw error;
  const row = data as { id: string; make: string; model: string; year: number; vin: string | null };
  return { id: row.id, make: row.make, model: row.model, year: row.year, vin: row.vin };
}

export async function listSavedSearches(): Promise<SavedSearch[]> {
  if (!isSupabaseConfigured) return SAVED_SEARCHES;
  const { data, error } = await requireSupabase()
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (
    data as {
      id: string;
      query_en: string;
      query_ar: string;
      meta_en: string;
      meta_ar: string;
      alerts_enabled: boolean;
    }[]
  ).map((row) => ({
    id: row.id,
    query: { en: row.query_en, ar: row.query_ar },
    meta: { en: row.meta_en, ar: row.meta_ar },
    alertsEnabled: row.alerts_enabled,
  }));
}

export async function setSavedSearchAlerts(id: string, enabled: boolean): Promise<void> {
  if (!isSupabaseConfigured) {
    const entry = SAVED_SEARCHES.find((s) => s.id === id);
    if (entry) entry.alertsEnabled = enabled;
    return;
  }
  const { error } = await requireSupabase()
    .from('saved_searches')
    .update({ alerts_enabled: enabled })
    .eq('id', id);
  if (error) throw error;
}

export async function saveSearch(filters: ProductFilters, label: string): Promise<void> {
  if (!isSupabaseConfigured) {
    SAVED_SEARCHES.unshift({
      id: `local-${Date.now()}`,
      query: { en: label, ar: label },
      meta: { en: 'Saved just now', ar: 'تم الحفظ الآن' },
      alertsEnabled: true,
    });
    return;
  }
  const { error } = await requireSupabase().from('saved_searches').insert({
    query_en: label,
    query_ar: label,
    meta_en: 'Saved just now',
    meta_ar: 'تم الحفظ الآن',
    alerts_enabled: true,
    filters,
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  reference: string;
  shop_id: string;
  buyer_name_en: string;
  buyer_name_ar: string;
  city_en: string;
  city_ar: string;
  status: OrderStatus;
  total_iqd: number;
  payment_method: 'cod' | 'card';
  items: Order['items'] | null;
  timeline: Order['timeline'] | null;
  created_at?: string;
  shop_name_en?: string;
  shop_name_ar?: string;
  last_note?: string | null;
  address?: string;
  phone?: string;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    reference: row.reference,
    shopId: row.shop_id,
    buyerName: { en: row.buyer_name_en, ar: row.buyer_name_ar },
    city: { en: row.city_en, ar: row.city_ar },
    status: row.status,
    totalIqd: row.total_iqd,
    paymentMethod: row.payment_method,
    items: row.items ?? [],
    timeline: row.timeline ?? {},
    createdAt: row.created_at,
    note: row.last_note ?? null,
    shopName: row.shop_name_en ? { en: row.shop_name_en, ar: row.shop_name_ar ?? row.shop_name_en } : undefined,
    address: row.address ?? '',
    phone: row.phone ?? '',
  };
}

export async function listShopOrders(shopId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return ORDERS.filter((o) => o.shopId === shopId);
  const { data, error } = await requireSupabase()
    .from('orders_with_items')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(toOrder);
}

export async function listBuyerOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return BUYER_ORDERS;
  const { data, error } = await requireSupabase()
    .from('orders_with_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(toOrder);
}

export async function getOrder(id: string): Promise<Order> {
  if (!isSupabaseConfigured) {
    return ORDERS.find((o) => o.id === id) ?? BUYER_ORDERS.find((o) => o.id === id) ?? ORDERS[0];
  }
  const { data, error } = await requireSupabase()
    .from('orders_with_items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return toOrder(data as OrderRow);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const order = ORDERS.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.timeline = { ...order.timeline, [status]: new Date().toISOString() };
    }
    return;
  }
  const db = requireSupabase();
  const { error } = await db.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
  // `order_events` is the append-only history the timeline reads back from,
  // so the move is recorded explicitly rather than inferred from the order row.
  const { error: eventError } = await db
    .from('order_events')
    .insert({ order_id: id, status, note: note || null });
  if (eventError) throw eventError;
}

export async function placeOrder(input: {
  shopId: string;
  items: Order['items'];
  totalIqd: number;
  city: { en: string; ar: string };
  paymentMethod: 'cod' | 'card';
  address: string;
  phone: string;
}): Promise<string> {
  if (!isSupabaseConfigured) {
    const id = `local-${Date.now()}`;
    const shop = SHOPS.find((s) => s.id === input.shopId);
    const created: Order = {
      id,
      reference: `AK-${Math.floor(10000 + Math.random() * 89999)}`,
      shopId: input.shopId,
      buyerName: { en: PROFILE.fullName, ar: PROFILE.fullName },
      city: input.city,
      status: 'received',
      totalIqd: input.totalIqd,
      paymentMethod: input.paymentMethod,
      items: input.items,
      timeline: { received: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      shopName: shop?.name,
      address: input.address,
      phone: input.phone,
    };
    ORDERS.unshift(created);
    BUYER_ORDERS.unshift(created);
    return id;
  }
  const { data, error } = await requireSupabase()
    .rpc('place_order', {
      p_shop_id: input.shopId,
      p_total_iqd: input.totalIqd,
      p_city_en: input.city.en,
      p_city_ar: input.city.ar,
      p_payment_method: input.paymentMethod,
      p_items: input.items,
      p_address: input.address,
      p_phone: input.phone,
    })
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}
