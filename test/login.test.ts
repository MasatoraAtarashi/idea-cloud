import { describe, expect, it } from "vitest";
import { GOOGLE_LOGIN_CTA } from "../app/auth/google-login";

const loginGateSrc = import.meta.glob(
  ["../app/components/login-gate.tsx", "../app/components/brand.tsx"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

describe("login page (Google OAuth mock)", () => {
  it("uses a Google sign-in CTA", () => {
    expect(GOOGLE_LOGIN_CTA).toBe("Google でログイン");
  });

  it("keeps the gate to app name, login title, and one button", () => {
    const src = Object.values(loginGateSrc).join("\n");
    expect(src).toContain("アイデアクラウド");
    expect(src).toContain("BrandMark");
    expect(src).toContain("ログイン");
    expect(src).toContain("GOOGLE_LOGIN_CTA");
    expect(src).not.toMatch(
      /思考の整理学|画面マップ|許可リスト|画面確認用|Google アカウントで続行/,
    );
    expect(src).not.toContain("GOOGLE_LOGIN_HINT");
  });
});
