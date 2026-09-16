import { describe, expect, it } from "vitest";
import { GOOGLE_LOGIN_CTA, GOOGLE_LOGIN_HINT } from "../app/auth/google-login";

describe("login page (Google OAuth mock)", () => {
  it("uses a Google sign-in CTA", () => {
    expect(GOOGLE_LOGIN_CTA).toBe("Google でログイン");
    expect(GOOGLE_LOGIN_HINT).toBe("Google アカウントで続行します");
  });

  it("does not advertise a public product essay on the gate", () => {
    expect(GOOGLE_LOGIN_HINT).not.toMatch(/画面マップ|思考の整理学|画面確認用/);
  });
});
