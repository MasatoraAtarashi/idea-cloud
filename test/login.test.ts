import { describe, expect, it } from "vitest";
import {
  GOOGLE_LOGIN_CTA,
  GOOGLE_LOGIN_NOTE,
  googleLoginHref,
  loginErrorMessage,
  LOGIN_TAGLINE,
} from "../app/auth/google-login";

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
    expect(GOOGLE_LOGIN_CTA).toBe("Google で続行");
    expect(LOGIN_TAGLINE).toContain("寝かせ");
    expect(GOOGLE_LOGIN_NOTE).toContain("組織アカウント");
  });

  it("sends the visitor to the Worker OAuth start with a same-site next", () => {
    expect(googleLoginHref("/app/list")).toBe("/api/auth/google?next=%2Fapp%2Flist");
  });

  it("explains why a sign-in failed", () => {
    expect(loginErrorMessage(null)).toBeNull();
    expect(loginErrorMessage("not_allowed")).toContain("許可されていません");
    expect(loginErrorMessage("google_denied")).toContain("キャンセル");
    expect(loginErrorMessage("something-new")).toContain("ログインできませんでした");
  });

  it("keeps the gate to brand, tagline, and one button", () => {
    const src = Object.values(loginGateSrc).join("\n");
    expect(src).toContain("アイデアクラウド");
    expect(src).toContain("BrandMark");
    expect(src).toContain("GOOGLE_LOGIN_CTA");
    expect(src).toContain("LOGIN_TAGLINE");
    expect(src).toContain("GOOGLE_LOGIN_NOTE");
    expect(src).toContain("NEW_IDEA_PATH");
    expect(src).toContain("homePathForClient");
    expect(src).toContain("googleLoginHref");
    // The CTA must start the real flow, not link into the app.
    expect(src).not.toMatch(/<Link\s+to=\{continueTo\}/);
    expect(src).not.toMatch(
      /思考の整理学|画面マップ|許可リスト|画面確認用|Google アカウントで続行/,
    );
  });
});
