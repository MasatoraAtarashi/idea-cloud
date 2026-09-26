/**
 * Locale resolution shared by the Worker, SSR and the browser. Pure functions
 * only — no React, no Cloudflare bindings — so the Hono entry can call it
 * before the React Router handler runs.
 */

export const LOCALES = ["ja", "en", "zh", "ko"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

/** Cookie the language switcher writes. Readable by JS: no secret in it. */
export const LOCALE_COOKIE = "lang";

/** One year — a language choice should outlive the session cookie. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native name of each locale, for the switcher. Never translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
};

/** `<html lang>` / `hreflang` value. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh-Hans",
  ko: "ko",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeFromCookieHeader(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name !== LOCALE_COOKIE) continue;
    const value = decodeURIComponent(rest.join("="));
    return isLocale(value) ? value : null;
  }
  return null;
}

/** Maps a BCP 47 tag onto one of our locales. `zh-TW` and `zh-Hant` both land on `zh`. */
function matchLocale(tag: string): Locale | null {
  const base = tag.trim().toLowerCase().split("-")[0];
  return isLocale(base) ? base : null;
}

/** Highest-quality `Accept-Language` entry we can serve, or null. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.split("=")[1]) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);
  for (const entry of ranked) {
    const locale = matchLocale(entry.tag);
    if (locale) return locale;
  }
  return null;
}

/** Cookie wins over the browser's preference; both lose to nothing but the default. */
export function resolveLocale(request: Request): Locale {
  return (
    localeFromCookieHeader(request.headers.get("cookie")) ??
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

export function localeCookieHeader(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
