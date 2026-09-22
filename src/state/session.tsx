import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

const DEMO_SESSION_KEY = 'ackses.demo-session';

/** The signed-in user, flattened to what the UI actually reads. */
export type AccountUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  /** Set once the account owns a shop; drives access to the seller tabs. */
  sellerId: string | null;
};

export type AuthError = {
  /** Which field to highlight, when the failure belongs to one. */
  field?: 'email' | 'password' | 'fullName' | 'shopName' | 'city';
  /** A key into the string table, so the message stays bilingual. */
  messageKey:
    | 'authInvalidEmail'
    | 'authWeakPassword'
    | 'authPasswordMismatch'
    | 'authNameRequired'
    | 'authShopNameRequired'
    | 'authEmailTaken'
    | 'authBadCredentials'
    | 'authEmailNotConfirmed'
    | 'authRateLimited'
    | 'authGeneric';
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ShopSetupInput = {
  nameEn: string;
  nameAr: string;
  cityEn: string;
  cityAr: string;
  address: string;
};

type SessionValue = {
  user: AccountUser | null;
  /** True while the stored session is being read back on launch. */
  loading: boolean;
  /** True while a sign-in / sign-up request is in flight. */
  busy: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  /**
   * `needsConfirmation` is true when Supabase accepted the account but issued
   * no session, which is what happens with email confirmation left on. The
   * caller must not read `user` to work this out — it has not updated yet.
   */
  signUp: (input: SignUpInput) => Promise<{ error: AuthError | null; needsConfirmation: boolean }>;
  /** Creates the seller + shop rows for the signed-in account. */
  createShop: (input: ShopSetupInput) => Promise<AuthError | null>;
  sendPasswordReset: (email: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  /**
   * False when running on demo fixtures, where sign-in is simulated on-device
   * and no real account exists. The auth screens say so explicitly.
   */
  isReal: boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Validation — shared by both paths so the rules never diverge
// ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Supabase's own default minimum; kept here so we can fail before the call. */
export const MIN_PASSWORD_LENGTH = 8;

function validateSignUp(input: SignUpInput): AuthError | null {
  if (!input.fullName.trim()) return { field: 'fullName', messageKey: 'authNameRequired' };
  if (!EMAIL_RE.test(input.email.trim())) return { field: 'email', messageKey: 'authInvalidEmail' };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { field: 'password', messageKey: 'authWeakPassword' };
  }
  if (input.password !== input.confirmPassword) {
    return { field: 'password', messageKey: 'authPasswordMismatch' };
  }
  return null;
}

/**
 * Supabase returns human-readable English strings; map the ones worth showing
 * differently onto our own bilingual keys and let the rest fall through.
 */
function mapSupabaseError(message: string): AuthError {
  const text = message.toLowerCase();
  if (text.includes('already registered') || text.includes('already been registered')) {
    return { field: 'email', messageKey: 'authEmailTaken' };
  }
  if (text.includes('invalid login credentials')) {
    return { messageKey: 'authBadCredentials' };
  }
  if (text.includes('email not confirmed')) {
    return { messageKey: 'authEmailNotConfirmed' };
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return { messageKey: 'authRateLimited' };
  }
  if (text.includes('password')) {
    return { field: 'password', messageKey: 'authWeakPassword' };
  }
  return { messageKey: 'authGeneric' };
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  /** Reads the profile and seller rows that hang off an authenticated user. */
  const hydrateFromSession = useCallback(async (session: Session | null) => {
    if (!session?.user || !supabase) {
      setUser(null);
      return;
    }
    const authUser = session.user;

    const [{ data: profile }, { data: seller }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', authUser.id).maybeSingle(),
      supabase.from('sellers').select('id').eq('user_id', authUser.id).maybeSingle(),
    ]);

    setUser({
      id: authUser.id,
      email: authUser.email ?? '',
      // The trigger in 0004_auth.sql copies the name across at sign-up; fall
      // back to the raw metadata in case the row has not landed yet.
      fullName: profile?.full_name || (authUser.user_metadata?.full_name as string) || '',
      phone: profile?.phone ?? authUser.phone ?? null,
      sellerId: seller?.id ?? null,
    });
  }, []);

  // Launch: restore whatever session exists.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          const stored = await AsyncStorage.getItem(DEMO_SESSION_KEY);
          if (!cancelled && stored) setUser(JSON.parse(stored) as AccountUser);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (!cancelled) await hydrateFromSession(data.session);
      } catch {
        // No session, or storage unavailable — start signed out.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    if (!isSupabaseConfigured || !supabase) return () => { cancelled = true; };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromSession(session).catch(() => {});
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  /** Stands in for a real account when no Supabase project is configured. */
  const startDemoSession = useCallback(async (email: string, fullName: string) => {
    const demo: AccountUser = {
      id: 'demo-user',
      email,
      fullName: fullName || email.split('@')[0],
      phone: '+964 770 ••• 4412',
      sellerId: null,
    };
    setUser(demo);
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demo)).catch(() => {});
  }, []);

  const signIn = useCallback<SessionValue['signIn']>(
    async (email, password) => {
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) return { field: 'email', messageKey: 'authInvalidEmail' };
      if (!password) return { field: 'password', messageKey: 'authBadCredentials' };

      setBusy(true);
      try {
        if (!isSupabaseConfigured || !supabase) {
          await startDemoSession(trimmed, '');
          return null;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (error) return mapSupabaseError(error.message);
        return null;
      } catch {
        return { messageKey: 'authGeneric' };
      } finally {
        setBusy(false);
      }
    },
    [startDemoSession],
  );

  const signUp = useCallback<SessionValue['signUp']>(
    async (input) => {
      const invalid = validateSignUp(input);
      if (invalid) return { error: invalid, needsConfirmation: false };

      const email = input.email.trim();
      const fullName = input.fullName.trim();

      setBusy(true);
      try {
        if (!isSupabaseConfigured || !supabase) {
          await startDemoSession(email, fullName);
          return { error: null, needsConfirmation: false };
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: input.password,
          // Read by the handle_new_user trigger to seed public.profiles.
          options: { data: { full_name: fullName } },
        });
        if (error) return { error: mapSupabaseError(error.message), needsConfirmation: false };
        // No session means the project has email confirmation switched on.
        return { error: null, needsConfirmation: !data.session };
      } catch {
        return { error: { messageKey: 'authGeneric' }, needsConfirmation: false };
      } finally {
        setBusy(false);
      }
    },
    [startDemoSession],
  );

  const createShop = useCallback<SessionValue['createShop']>(
    async (input) => {
      if (!input.nameEn.trim()) return { field: 'shopName', messageKey: 'authShopNameRequired' };

      setBusy(true);
      try {
        if (!isSupabaseConfigured || !supabase) {
          setUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, sellerId: 'demo-seller' };
            AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
          return null;
        }

        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        if (!authUser) return { messageKey: 'authBadCredentials' };

        const nameEn = input.nameEn.trim();
        const nameAr = input.nameAr.trim() || nameEn;
        const year = new Date().getFullYear();

        // A seller record may already exist if they got halfway through before.
        const { data: existing } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        let sellerId = existing?.id as string | undefined;

        if (!sellerId) {
          const displayName = user?.fullName || nameEn;
          const { data: created, error: sellerError } = await supabase
            .from('sellers')
            .insert({
              user_id: authUser.id,
              name_en: displayName,
              name_ar: displayName,
              initial_en: displayName.charAt(0).toUpperCase(),
              initial_ar: displayName.charAt(0).toUpperCase(),
              member_since: year,
              city_en: input.cityEn,
              city_ar: input.cityAr,
            })
            .select('id')
            .single();
          if (sellerError) return mapSupabaseError(sellerError.message);
          sellerId = (created as { id: string }).id;
        }

        const { error: shopError } = await supabase.from('shops').insert({
          seller_id: sellerId,
          name_en: nameEn,
          name_ar: nameAr,
          initial: nameEn.charAt(0).toUpperCase(),
          city_en: input.cityEn,
          city_ar: input.cityAr,
          address_en: input.address,
          address_ar: input.address,
          since: year,
        });
        if (shopError) return mapSupabaseError(shopError.message);

        setUser((prev) => (prev ? { ...prev, sellerId: sellerId ?? null } : prev));
        return null;
      } catch {
        return { messageKey: 'authGeneric' };
      } finally {
        setBusy(false);
      }
    },
    [user?.fullName],
  );

  const sendPasswordReset = useCallback<SessionValue['sendPasswordReset']>(async (email) => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) return { field: 'email', messageKey: 'authInvalidEmail' };

    setBusy(true);
    try {
      if (!isSupabaseConfigured || !supabase) return null;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: 'ackses://reset-password',
      });
      if (error) return mapSupabaseError(error.message);
      return null;
    } catch {
      return { messageKey: 'authGeneric' };
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    await AsyncStorage.removeItem(DEMO_SESSION_KEY).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      loading,
      busy,
      signIn,
      signUp,
      createShop,
      sendPasswordReset,
      signOut,
      isReal: isSupabaseConfigured,
    }),
    [user, loading, busy, signIn, signUp, createShop, sendPasswordReset, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
