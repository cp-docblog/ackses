import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TextStyle } from 'react-native';

import { fonts, type FontWeightToken } from '../theme';
import { ar, en, type Lang, type Strings } from './strings';

const STORAGE_KEY = 'ackses.lang';

type I18nValue = {
  lang: Lang;
  t: Strings;
  isRTL: boolean;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  /** Font family for the active language at a given weight. */
  font: (weight?: FontWeightToken) => string;
  /**
   * Direction-aware text style. React Native does not re-lay-out on a
   * `direction` style change without a reload, so we resolve alignment
   * ourselves instead of relying on `I18nManager`.
   */
  align: (alignment?: 'start' | 'end' | 'center') => TextStyle;
  /** `row` in LTR, `row-reverse` in RTL. */
  row: 'row' | 'row-reverse';
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'ar') setLangState(stored);
      })
      .catch(() => {
        /* first run, or storage unavailable — English is a fine default */
      });
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<I18nValue>(() => {
    const isRTL = lang === 'ar';
    const family = isRTL ? fonts.arabic : fonts.latin;
    return {
      lang,
      t: isRTL ? ar : en,
      isRTL,
      setLang,
      toggleLang: () => setLang(isRTL ? 'en' : 'ar'),
      font: (weight: FontWeightToken = 400) => family[weight],
      align: (alignment: 'start' | 'end' | 'center' = 'start') => ({
        textAlign:
          alignment === 'center' ? 'center' : alignment === 'start' ? (isRTL ? 'right' : 'left') : isRTL ? 'left' : 'right',
        writingDirection: isRTL ? 'rtl' : 'ltr',
      }),
      row: isRTL ? 'row-reverse' : 'row',
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}

export type { Lang, Strings };
