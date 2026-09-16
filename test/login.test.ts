import { describe, expect, it } from "vitest";
import { GOOGLE_LOGIN_CTA } from "../app/auth/google-login";

describe("login page (Google OAuth mock)", () => {
  it("uses a Google sign-in CTA", () => {
    expect(GOOGLE_LOGIN_CTA).toBe("Google でログイン");
  });
});
