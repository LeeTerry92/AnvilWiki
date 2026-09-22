export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

export const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US',
  ja: 'ja_JP',
};

export function isDefaultLocale(locale: string): boolean {
  return locale === defaultLocale;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

