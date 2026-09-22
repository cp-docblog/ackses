import { useCallback } from 'react';
import { router } from 'expo-router';

import type { Strings } from '../i18n/strings';
import { useSession } from '../state/session';

/** Explains, in the sign-in screen's own copy, why the gate appeared. */
export type GateReason = Extract<
  keyof Strings,
  'signInToCheckout' | 'signInToSave' | 'signInToSell' | 'signInToGarage'
>;

/**
 * Browsing is open; acting is not. Wrap an action that needs an account and
 * the user is sent to sign-in with a `next` route, landing back here once
 * they are through.
 */
export function useAuthGate() {
  const { user } = useSession();

  const require = useCallback(
    (action: () => void, options: { reason: GateReason; next: string }) => {
      if (user) {
        action();
        return;
      }
      router.push({
        pathname: '/(auth)/sign-in',
        params: { next: options.next, reason: options.reason },
      });
    },
    [user],
  );

  return { signedIn: !!user, require };
}
