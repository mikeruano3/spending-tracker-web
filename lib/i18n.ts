import en from '@/dictionaries/en.json'
import es from '@/dictionaries/es.json'
import { locales, defaultLocale } from '@/lib/locales'
import type { Locale } from '@/lib/locales'

const dictionaries = { en, es } as Record<Locale, typeof en>

export type { Locale }
export { locales, defaultLocale }

export const hasLocale = (s: string): s is Locale =>
  (locales as readonly string[]).includes(s)

export const getDictionary = async (locale: Locale) => dictionaries[locale]
