import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("request-id ミドルウェア", () => {
  it("レスポンスに x-request-id ヘッダが付与される", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos", {
      headers: { "cf-access-authenticated-user-email": "user@example.com" },
    });
    expect(res.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("送信した x-request-id がそのまま使われる", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos", {
      headers: {
        "cf-access-authenticated-user-email": "user@example.com",
        "x-request-id": "req-test-123",
      },
    });
    expect(res.headers.get("x-request-id")).toBe("req-test-123");
  });
});

describe("security headers", () => {
  it("API 応答に基礎セキュリティヘッダが付く", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos", {
      headers: { "cf-access-authenticated-user-email": "user@example.com" },
    });
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  });
});
