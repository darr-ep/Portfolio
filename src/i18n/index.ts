import { es } from './es';
import { en } from './en';

const translations = { es, en } as const;

export type Lang = keyof typeof translations;

/**
 * Returns a typed lookup function for the given locale.
 * Falls back to the ES value when the EN key is missing.
 */
export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    const keys = key.split('.');
    // Try requested locale first
    let value: unknown = translations[lang];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    if (value !== undefined && value !== null) return value as string;

    // Fallback to Spanish
    let fallback: unknown = translations['es'];
    for (const k of keys) {
      fallback = (fallback as Record<string, unknown>)?.[k];
    }
    return (fallback as string) ?? key;
  };
}

/**
 * Shorthand: resolve a translation key directly.
 */
export const t = (locale: Lang, key: string): string =>
  useTranslations(locale)(key);

/**
 * Resolve a bilingual Supabase column value.
 * col(row, 'title', 'en') → row.title_en
 */
export const col = <T extends Record<string, unknown>>(
  row: T,
  base: string,
  locale: Lang
): string => (row[`${base}_${locale}`] as string) ?? (row[`${base}_es`] as string) ?? '';

export { es, en };
