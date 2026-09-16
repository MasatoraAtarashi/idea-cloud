import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("login page (Google OAuth mock)", () => {
  it("is public and looks like Sign in with Google", async () => {
    const res = await exports.default.fetch("https://example.com/login");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Google でログイン");
    expect(html).toContain("Google アカウントで継続します");
    expect(html).not.toContain("Cloudflare Access");
  });
});
