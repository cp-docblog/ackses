import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as repo from '../data/repository';
import type { OrderStatus, ProductFilters, Vehicle } from '../data/types';

export const keys = {
  products: (filters: ProductFilters, sub: number | null) => ['products', filters, sub] as const,
  product: (id: string) => ['product', id] as const,
  shop: (id: string) => ['shop', id] as const,
  shopProducts: (id: string) => ['shop-products', id] as const,
  shopReviews: (id: string) => ['shop-reviews', id] as const,
  seller: (id: string) => ['seller', id] as const,
  sellerShops: (id: string) => ['seller-shops', id] as const,
  garage: () => ['garage'] as const,
  savedSearches: () => ['saved-searches'] as const,
  shopOrders: (id: string) => ['shop-orders', id] as const,
  buyerOrders: () => ['buyer-orders'] as const,
  order: (id: string) => ['order', id] as const,
};

export function useProducts(filters: ProductFilters, subcategoryPosition: number | null) {
  return useQuery({
    queryKey: keys.products(filters, subcategoryPosition),
    queryFn: () => repo.searchProducts(filters, subcategoryPosition),
  });
}

export function useProduct(id: string, vehicle: Vehicle | null) {
  return useQuery({
    queryKey: keys.product(id),
    queryFn: () => repo.getProduct(id, vehicle),
    enabled: !!id,
  });
}

export function useShop(id: string) {
  return useQuery({ queryKey: keys.shop(id), queryFn: () => repo.getShop(id), enabled: !!id });
}

export function useShopProducts(id: string, vehicle: Vehicle | null) {
  return useQuery({
    queryKey: keys.shopProducts(id),
    queryFn: () => repo.listShopProducts(id, vehicle),
    enabled: !!id,
  });
}

export function useShopReviews(id: string) {
  return useQuery({
    queryKey: keys.shopReviews(id),
    queryFn: () => repo.listShopReviews(id),
    enabled: !!id,
  });
}

export function useSeller(id: string) {
  return useQuery({ queryKey: keys.seller(id), queryFn: () => repo.getSeller(id), enabled: !!id });
}

export function useSellerShops(id: string) {
  return useQuery({
    queryKey: keys.sellerShops(id),
    queryFn: () => repo.listSellerShops(id),
    enabled: !!id,
  });
}

export function useGarage() {
  return useQuery({ queryKey: keys.garage(), queryFn: repo.listGarage });
}

export function useSavedSearches() {
  return useQuery({ queryKey: keys.savedSearches(), queryFn: repo.listSavedSearches });
}

export function useToggleSavedSearch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      repo.setSavedSearchAlerts(id, enabled),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.savedSearches() }),
  });
}

export function useSaveSearch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ filters, label }: { filters: ProductFilters; label: string }) =>
      repo.saveSearch(filters, label),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.savedSearches() }),
  });
}

export function useShopOrders(shopId: string) {
  return useQuery({
    queryKey: keys.shopOrders(shopId),
    queryFn: () => repo.listShopOrders(shopId),
    enabled: !!shopId,
  });
}

export function useBuyerOrders() {
  return useQuery({ queryKey: keys.buyerOrders(), queryFn: repo.listBuyerOrders });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: keys.order(id), queryFn: () => repo.getOrder(id), enabled: !!id });
}

export function useUpdateOrderStatus(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note: string }) =>
      repo.updateOrderStatus(id, status, note),
    onSuccess: (_result, variables) => {
      client.invalidateQueries({ queryKey: keys.shopOrders(shopId) });
      client.invalidateQueries({ queryKey: keys.order(variables.id) });
      client.invalidateQueries({ queryKey: keys.buyerOrders() });
    },
  });
}

export function useDeleteProduct(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteProduct(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.shopProducts(shopId) });
      client.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateProduct(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: repo.NewProduct) => repo.createProduct(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.shopProducts(shopId) });
      client.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function usePlaceOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: repo.placeOrder,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.buyerOrders() });
      client.invalidateQueries({ queryKey: ['shop-orders'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Profile, follows, seller tools
// ─────────────────────────────────────────────────────────────

export const moreKeys = {
  profile: () => ['profile'] as const,
  following: (shopId: string) => ['following', shopId] as const,
  payouts: (sellerId: string) => ['payouts', sellerId] as const,
};

export function useProfile(enabled = true) {
  return useQuery({ queryKey: moreKeys.profile(), queryFn: repo.getProfile, enabled });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof repo.updateProfile>[0]) => repo.updateProfile(patch),
    onSuccess: () => client.invalidateQueries({ queryKey: moreKeys.profile() }),
  });
}

export function useFollowing(shopId: string, enabled = true) {
  return useQuery({
    queryKey: moreKeys.following(shopId),
    queryFn: () => repo.isFollowingShop(shopId),
    enabled: enabled && !!shopId,
  });
}

export function useSetFollowing(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (following: boolean) => repo.setFollowingShop(shopId, following),
    onSuccess: () => client.invalidateQueries({ queryKey: moreKeys.following(shopId) }),
  });
}

export function useUpdateShop(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: repo.ShopPatch) => repo.updateShop(shopId, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.shop(shopId) }),
  });
}

export function useUpdateProduct(shopId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: repo.NewProduct }) => repo.updateProduct(id, input),
    onSuccess: (_r, v) => {
      client.invalidateQueries({ queryKey: keys.shopProducts(shopId) });
      client.invalidateQueries({ queryKey: keys.product(v.id) });
      client.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateSellerContact(sellerId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof repo.updateSellerContact>[1]) => repo.updateSellerContact(sellerId, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.seller(sellerId) }),
  });
}

export function usePayouts(sellerId: string) {
  return useQuery({
    queryKey: moreKeys.payouts(sellerId),
    queryFn: () => repo.listPayouts(sellerId),
    enabled: !!sellerId,
  });
}

export function useRequestPayout(sellerId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ amountIqd, method }: { amountIqd: number; method: Parameters<typeof repo.requestPayout>[2] }) =>
      repo.requestPayout(sellerId, amountIqd, method),
    onSuccess: () => client.invalidateQueries({ queryKey: moreKeys.payouts(sellerId) }),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: ({ sellerId, reason, details }: { sellerId: string; reason: string; details: string }) =>
      repo.createReport(sellerId, reason, details),
  });
}
