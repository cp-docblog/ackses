import { useSession } from '../state/session';
import { useSellerShops } from './queries';
import { DEMO_SHOP_ID } from '../data/repository';

/**
 * The shop the signed-in seller manages. Every seller screen used to hard-code
 * the seeded shop; this resolves it from the account so a newly registered
 * seller sees their own. Falls back to the demo shop on fixtures.
 */
export function useMyShopId(): string {
  const { user } = useSession();
  const { data: shops } = useSellerShops(user?.sellerId ?? '');
  return shops?.[0]?.id ?? (user?.sellerId ? '' : DEMO_SHOP_ID);
}

export function useMySellerId(): string {
  const { user } = useSession();
  return user?.sellerId ?? '00000000-0000-4000-8000-000000000101';
}
