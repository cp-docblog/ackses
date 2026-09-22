import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GARAGE } from '../data/fixtures';
import { defaultFilters, type ProductFilters, type Vehicle } from '../data/types';

const CART_KEY = 'ackses.cart';
const VEHICLE_KEY = 'ackses.vehicle';
const ROLE_KEY = 'ackses.role';

export type Role = 'buyer' | 'seller';

/** Quantity keyed by product id. The cart lives on the device until checkout. */
export type Cart = Record<string, number>;

type Store = {
  // Cart
  cart: Cart;
  cartCount: number;
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Active vehicle — drives the "Fits" badge and the fitment filter
  vehicle: Vehicle | null;
  setVehicle: (vehicle: Vehicle) => void;

  // Filters shared between the listings screen and the filter sheet
  filters: ProductFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProductFilters>>;
  resetFilters: () => void;

  // Buyer / seller mode
  role: Role;
  setRole: (role: Role) => void;

  /** False until persisted state has been read back. */
  hydrated: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [vehicle, setVehicleState] = useState<Vehicle | null>(GARAGE[0]);
  const [filters, setFilters] = useState<ProductFilters>({
    ...defaultFilters,
    vehicle: GARAGE[0],
  });
  const [role, setRoleState] = useState<Role>('buyer');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedCart, storedVehicle, storedRole] = await AsyncStorage.multiGet([
          CART_KEY,
          VEHICLE_KEY,
          ROLE_KEY,
        ]);
        if (cancelled) return;
        if (storedCart[1]) setCart(JSON.parse(storedCart[1]) as Cart);
        if (storedVehicle[1]) {
          const parsed = JSON.parse(storedVehicle[1]) as Vehicle;
          setVehicleState(parsed);
          setFilters((prev) => ({ ...prev, vehicle: parsed }));
        }
        if (storedRole[1] === 'buyer' || storedRole[1] === 'seller') setRoleState(storedRole[1]);
      } catch {
        // Corrupt or unavailable storage — carry on with defaults.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistCart = useCallback((next: Cart) => {
    setCart(next);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setVehicle = useCallback((next: Vehicle) => {
    setVehicleState(next);
    setFilters((prev) => ({ ...prev, vehicle: next }));
    AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    AsyncStorage.setItem(ROLE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<Store>(() => {
    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    return {
      cart,
      cartCount,
      addToCart: (productId, qty = 1) =>
        persistCart({ ...cart, [productId]: (cart[productId] ?? 0) + qty }),
      setQty: (productId, qty) => {
        const next = { ...cart };
        if (qty <= 0) delete next[productId];
        else next[productId] = qty;
        persistCart(next);
      },
      removeFromCart: (productId) => {
        const next = { ...cart };
        delete next[productId];
        persistCart(next);
      },
      clearCart: () => persistCart({}),
      vehicle,
      setVehicle,
      filters,
      setFilters,
      resetFilters: () => setFilters({ ...defaultFilters, vehicle }),
      role,
      setRole,
      hydrated,
    };
  }, [cart, persistCart, vehicle, setVehicle, filters, role, setRole, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
