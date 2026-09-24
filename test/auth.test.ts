import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";

const saved = {
  AUTH_MOCK: env.AUTH_MOCK,
  LOCAL_DEV_USER_EMAIL: env.LOCAL_DEV_USER_EMAIL,
  ACCESS_ALLOWED_EMAILS: env.ACCESS_ALLOWED_EMAILS,
};

afterEach(() => {
  env.AUTH_MOCK = saved.AUTH_MOCK;
  env.LOCAL_DEV_USER_EMAIL = saved.LOCAL_DEV_USER_EMAIL;
  env.ACCESS_ALLOWED_EMAILS = saved.ACCESS_ALLOWED_EMAILS;
});

const workersHost = "https://idea-cloud.kaito-technology.workers.dev";

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

  it("returns 401 on workers.dev when only LOCAL_DEV_USER_EMAIL is set", async () => {
    env.AUTH_MOCK = "";
    env.LOCAL_DEV_USER_EMAIL = "owner@example.com";
    const res = await exports.default.fetch(`${workersHost}/api/ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "Access なしでは作れない" }),
    });
    expect(res.status).toBe(401);
  });

  it("creates an idea on workers.dev when AUTH_MOCK=1 and no Access header", async () => {
    env.AUTH_MOCK = "1";
    env.LOCAL_DEV_USER_EMAIL = "owner@example.com";
    env.ACCESS_ALLOWED_EMAILS = "";
    const res = await exports.default.fetch(`${workersHost}/api/ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "モック認証で登録" }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { item: { title: string; body: string } };
    expect(created.item.title).toBe("モック認証で登録");
    expect(created.item.body).toBe("モック認証で登録");
  });

  it("returns 401 when AUTH_MOCK=1 but the mock email is missing", async () => {
    env.AUTH_MOCK = "1";
    env.LOCAL_DEV_USER_EMAIL = "";
    const res = await exports.default.fetch(`${workersHost}/api/ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "メールなし" }),
    });
    expect(res.status).toBe(401);
  });

  it("still enforces ACCESS_ALLOWED_EMAILS for the mock identity", async () => {
    env.AUTH_MOCK = "1";
    env.LOCAL_DEV_USER_EMAIL = "owner@example.com";
    env.ACCESS_ALLOWED_EMAILS = "other@example.com";
    const res = await exports.default.fetch(`${workersHost}/api/ideas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "許可外" }),
    });
    expect(res.status).toBe(403);
  });

  it("keeps the Access allowlist when an Access header is present", async () => {
    env.AUTH_MOCK = "1";
    env.LOCAL_DEV_USER_EMAIL = "owner@example.com";
    env.ACCESS_ALLOWED_EMAILS = "owner@example.com";
    const res = await exports.default.fetch(`${workersHost}/api/todos`, {
      headers: { "cf-access-authenticated-user-email": "stranger@example.com" },
    });
    expect(res.status).toBe(403);
  });
});
