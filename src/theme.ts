/**
 * ACKSES design tokens, lifted verbatim from the Claude Design prototype
 * (`project/ACKSES Marketplace.dc.html`). Keep these in sync with the design
 * file rather than hand-tuning values at the call site.
 */

export const colors = {
  /** Primary brand red. */
  red: '#E30613',
  redHover: '#ff3b47',
  /** Screen background. */
  black: '#000000',
  /** Raised surface: cards, sheets, tab pills. */
  surface: '#111111',
  /** Pressed / tertiary surface. */
  surfaceAlt: '#1a1a1a',
  /** Default 1px border. */
  border: '#333333',
  /** Quieter border used inside cards. */
  borderSoft: '#222222',
  /** Hairline between list rows. */
  hairline: '#1a1a1a',
  white: '#ffffff',
  /** Secondary text. */
  muted: '#A3A3A3',
  mutedDark: '#777777',
  /** Positive state (in stock, verified). */
  successBg: '#0f2a14',
  successBorder: '#1f6b2e',
  /** Warning state (low stock, pending). */
  warnBg: 'rgba(227,6,19,.2)',
  /** Inactive toggle track. */
  track: '#222222',
  trackBorder: '#444444',
  scrim: 'rgba(0,0,0,.7)',
} as const;

/** Striped placeholder used wherever the design shows a part photo. */
export const placeholder = {
  light: '#1c1c1c',
  dark: '#141414',
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 18,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 18,
  '4xl': 20,
  '5xl': 26,
} as const;

/**
 * Font families registered in `app/_layout.tsx`. Latin copy uses Montserrat,
 * Arabic uses Tajawal; `useT()` picks the right stack for the active language.
 */
export const fonts = {
  latin: {
    400: 'Montserrat_400Regular',
    500: 'Montserrat_500Medium',
    600: 'Montserrat_600SemiBold',
    700: 'Montserrat_700Bold',
    800: 'Montserrat_800ExtraBold',
  },
  arabic: {
    400: 'Tajawal_400Regular',
    500: 'Tajawal_500Medium',
    600: 'Tajawal_700Bold',
    700: 'Tajawal_700Bold',
    800: 'Tajawal_800ExtraBold',
  },
} as const;

export type FontWeightToken = keyof typeof fonts.latin;

/** Monospace is used for OEM numbers, VIN digits and order ids. */
export const mono = 'monospace';
