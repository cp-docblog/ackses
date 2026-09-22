import type { Lang } from '../i18n/strings';

/**
 * Iraqi dinar amounts are written with Western digits and thousands separators
 * in both languages, matching the design.
 */
export function formatIqd(value: number): string {
  return value.toLocaleString('en-US');
}

/** Pick the right side of a localized `{ en, ar }` pair. */
export function pick<T>(pair: { en: T; ar: T }, lang: Lang): T {
  return lang === 'ar' ? pair.ar : pair.en;
}

/** `9:12` style clock label for the order timeline. */
export function formatTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** `Toyota Camry 2018` — the label shown on the my-car chip. */
export function vehicleLabel(vehicle: { make: string; model: string; year: number } | null): string {
  return vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : '';
}
