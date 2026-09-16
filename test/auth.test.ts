import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("access-auth middleware", () => {
  it("returns 200 when the Access header is present", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos", {
      headers: { "cf-access-authenticated-user-email": "user@example.com" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 401 without credentials", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos");
    expect(res.status).toBe(401);
  });
});
