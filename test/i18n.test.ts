import { describe, expect, it } from "vitest";
import { dictionary } from "../app/i18n/dictionary";
import { FEATURE_ART } from "../app/components/landing/visuals";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isLocale,
  localeCookieHeader,
  localeFromAcceptLanguage,
  localeFromCookieHeader,
  resolveLocale,
} from "../app/i18n/locale";

function request(headers: Record<string, string>): Request {
  return new Request("https://example.test/", { headers });
}

describe("locale resolution", () => {
  it("knows which tags it can serve", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("falls back to Japanese when the visitor says nothing", () => {
    expect(resolveLocale(request({}))).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(request({ "accept-language": "fr-FR,fr;q=0.9" }))).toBe(DEFAULT_LOCALE);
  });

  it("reads the browser preference by quality, not by order", () => {
    expect(localeFromAcceptLanguage("fr;q=0.9,ko;q=0.95")).toBe("ko");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    // Traditional Chinese still lands on the one Chinese dictionary we ship.
    expect(localeFromAcceptLanguage("zh-TW")).toBe("zh");
    expect(localeFromAcceptLanguage("de;q=0")).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
  });

  it("lets an explicit choice outrank the browser", () => {
    const req = request({ cookie: `${LOCALE_COOKIE}=ko`, "accept-language": "en-US,en;q=0.9" });
    expect(resolveLocale(req)).toBe("ko");
  });

  it("ignores a cookie it cannot serve", () => {
    expect(localeFromCookieHeader("lang=klingon")).toBeNull();
    expect(localeFromCookieHeader("other=en; lang=zh")).toBe("zh");
    expect(localeFromCookieHeader(null)).toBeNull();
  });

  it("writes a same-site cookie that outlives the session", () => {
    const header = localeCookieHeader("en");
    expect(header).toContain("lang=en");
    expect(header).toContain("Path=/");
    expect(header).toContain("SameSite=Lax");
    expect(header).toMatch(/Max-Age=\d+/);
  });
});

describe("dictionaries", () => {
  it("ships every locale", () => {
    for (const locale of LOCALES) {
      expect(dictionary(locale).common.appName.length).toBeGreaterThan(0);
    }
  });

  it("falls back rather than crashing on an unknown locale", () => {
    // @ts-expect-error — guarding the runtime path a bad cookie could reach.
    expect(dictionary("klingon")).toBe(dictionary(DEFAULT_LOCALE));
  });

  it("keeps the same keys in every locale", () => {
    const shape = (value: unknown): unknown => {
      if (Array.isArray(value)) return "array";
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, inner]) => [key, shape(inner)]),
        );
      }
      return typeof value;
    };
    const ja = shape(dictionary("ja"));
    for (const locale of LOCALES) {
      expect(shape(dictionary(locale)), `locale ${locale}`).toEqual(ja);
    }
  });

  it("actually translates — no locale is a copy of Japanese", () => {
    const ja = dictionary("ja");
    for (const locale of LOCALES.filter((value) => value !== "ja")) {
      const t = dictionary(locale);
      expect(t.lp.hero.title, `locale ${locale}`).not.toBe(ja.lp.hero.title);
      expect(t.auth.cta, `locale ${locale}`).not.toBe(ja.auth.cta);
      expect(t.common.stage.spark, `locale ${locale}`).not.toBe(ja.common.stage.spark);
    }
  });
});

describe("landing product shot", () => {
  const stages = Object.keys(dictionary("ja").common.stage);

  it("names a real stage on every row, in every language", () => {
    for (const locale of LOCALES) {
      for (const row of dictionary(locale).lp.preview.rows) {
        expect(stages).toContain(row.stage);
      }
    }
  });

  it("keeps the shot the same shape in every language", () => {
    const ja = dictionary("ja").lp.preview;
    for (const locale of LOCALES) {
      const preview = dictionary(locale).lp.preview;
      expect(preview.rows).toHaveLength(ja.rows.length);
      expect(preview.ai.axes).toHaveLength(ja.ai.axes.length);
      // The bars are the same reading in every language; only the labels move.
      expect(preview.ai.axes.map((axis) => axis.value)).toEqual(
        ja.ai.axes.map((axis) => axis.value),
      );
    }
  });

  it("has one illustration per feature", () => {
    expect(FEATURE_ART).toHaveLength(dictionary("ja").lp.features.items.length);
  });
});
