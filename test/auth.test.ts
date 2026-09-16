import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("access-auth ミドルウェア", () => {
  it("Access ヘッダがあれば 200 を返す", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos", {
      headers: { "cf-access-authenticated-user-email": "user@example.com" },
    });
    expect(res.status).toBe(200);
  });

  it("認証情報がなければ 401 を返す", async () => {
    const res = await exports.default.fetch("https://example.com/api/todos");
    expect(res.status).toBe(401);
  });
});
