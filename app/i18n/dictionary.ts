import { DEFAULT_LOCALE, type Locale } from "./locale";
import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { zh } from "./locales/zh";

/**
 * Japanese is the source of truth: every other locale is typed against it, so
 * a key added here fails the build until all four files carry it.
 */
export type Dictionary = typeof ja;

const DICTIONARIES: Record<Locale, Dictionary> = { ja, en, zh, ko };

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
