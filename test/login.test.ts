import { describe, expect, it } from "vitest";
import { googleLoginHref, loginErrorMessage } from "../app/auth/google-login";
import { dictionary } from "../app/i18n/dictionary";
import { LOCALES } from "../app/i18n/locale";

const ja = dictionary("ja");

const loginGateSrc = import.meta.glob(
  ["../app/components/login-gate.tsx", "../app/components/brand.tsx"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

describe("login page (Google OAuth)", () => {
  it("uses a Google continue CTA", () => {
    expect(ja.auth.cta).toBe("Google で続行");
    expect(ja.auth.tagline).toContain("寝かせ");
    expect(ja.auth.note).toContain("組織アカウント");
  });

  it("offers the same gate copy in every locale", () => {
    for (const locale of LOCALES) {
      const t = dictionary(locale);
      expect(t.auth.cta.length).toBeGreaterThan(0);
      expect(t.auth.tagline.length).toBeGreaterThan(0);
      expect(Object.keys(t.auth.errors)).toEqual(Object.keys(ja.auth.errors));
    }
  });

  it("sends the visitor to the Worker OAuth start with a same-site next", () => {
    expect(googleLoginHref("/app/list")).toBe("/api/auth/google?next=%2Fapp%2Flist");
  });

  it("explains why a sign-in failed", () => {
    expect(loginErrorMessage(ja, null)).toBeNull();
    expect(loginErrorMessage(ja, "not_allowed")).toContain("許可されていません");
    expect(loginErrorMessage(ja, "google_denied")).toContain("キャンセル");
    expect(loginErrorMessage(ja, "something-new")).toContain("ログインできませんでした");
    expect(loginErrorMessage(dictionary("en"), "not_allowed")).toContain("allowlist");
  });

  it("keeps the gate to brand, tagline, and one button", () => {
    const src = Object.values(loginGateSrc).join("\n");
    expect(src).toContain("BrandMark");
    expect(src).toContain("t.auth.cta");
    expect(src).toContain("t.auth.tagline");
    expect(src).toContain("t.auth.note");
    expect(src).toContain("NEW_IDEA_PATH");
    expect(src).toContain("homePathForClient");
    expect(src).toContain("googleLoginHref");
    // The CTA must start the real flow, not link into the app.
    expect(src).not.toMatch(/<Link\s+to=\{continueTo\}/);
  });
});
