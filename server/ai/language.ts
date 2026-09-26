import { DEFAULT_LOCALE, type Locale } from "../../app/i18n/locale";

/**
 * What the model should write in. Named in the target language itself, which
 * these models follow more reliably than an English name for it.
 */
const LANGUAGE_NAME: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  ko: "한국어",
};

export function languageName(locale: Locale | undefined): string {
  return LANGUAGE_NAME[locale ?? DEFAULT_LOCALE] ?? LANGUAGE_NAME[DEFAULT_LOCALE];
}

/** Prose language instruction for a prompt whose output is shown as-is. */
export function writeInLanguage(locale: Locale | undefined): string {
  return `本文は必ず ${languageName(locale)} で書いてください。`;
}

/**
 * Same, for output we parse back out again. The section headings are storage
 * keys — `app/lib/evaluation-notes.ts` matches them, and a note written today
 * may be read months later by someone reading in another language — so they
 * stay Japanese while the prose follows the reader.
 */
export function writeInLanguageKeepingHeadings(
  locale: Locale | undefined,
  headings: readonly string[],
): string {
  return [
    `見出し（${headings.join("・")}）と「スコア:」の行は、この日本語のままにしてください。`,
    `見出しの下に書く本文は、必ず ${languageName(locale)} で書いてください。`,
  ].join("");
}
