import { exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import {
  isPremium,
  parsePremiumEmails,
  PREMIUM_REQUIRED_MESSAGE,
  resolvePlan,
} from "../server/billing/plan";
import { authHeaders, testEnv, TEST_USER_EMAIL } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

/** The suite runs with PREMIUM_EMAILS unset; restore that after each case. */
afterEach(() => {
  delete testEnv.PREMIUM_EMAILS;
});

describe("plan resolution", () => {
  it("treats every member as premium until PREMIUM_EMAILS is set", () => {
    expect(resolvePlan("solo@example.com", {} as Env)).toBe("premium");
    expect(resolvePlan("solo@example.com", { PREMIUM_EMAILS: "  " } as Env)).toBe("premium");
  });

  it("is free without a session", () => {
    expect(resolvePlan(null, {} as Env)).toBe("free");
    expect(resolvePlan("", {} as Env)).toBe("free");
    expect(resolvePlan("   ", { PREMIUM_EMAILS: "solo@example.com" } as Env)).toBe("free");
  });

  it("uses PREMIUM_EMAILS as the entitlement once set, ignoring case and spacing", () => {
    const env = { PREMIUM_EMAILS: " Owner@Example.com , paid@example.com " } as Env;
    expect(isPremium("owner@example.com", env)).toBe(true);
    expect(isPremium("OWNER@EXAMPLE.COM ", env)).toBe(true);
    expect(isPremium("paid@example.com", env)).toBe(true);
    expect(isPremium("free@example.com", env)).toBe(false);
    expect(resolvePlan("free@example.com", env)).toBe("free");
  });

  it("parses the list", () => {
    expect(parsePremiumEmails(undefined)).toEqual([]);
    expect(parsePremiumEmails(",, ,")).toEqual([]);
    expect(parsePremiumEmails("A@b.com, c@d.com")).toEqual(["a@b.com", "c@d.com"]);
  });
});

describe("premium gate on /api", () => {
  it("answers 402 on the AI endpoints for a member who is not entitled", async () => {
    const created = await api("/ideas", { method: "POST", body: JSON.stringify({ body: "課金" }) });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number } };

    testEnv.PREMIUM_EMAILS = "someone-else@example.com";
    for (const path of ["research", "brainstorm", "discuss", "evaluate"]) {
      const response = await api(`/ideas/${item.id}/${path}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(response.status, path).toBe(402);
      const body = (await response.json()) as { error: string; plan: string };
      expect(body.error).toBe(PREMIUM_REQUIRED_MESSAGE);
      expect(body.plan).toBe("free");
    }
  });

  it("leaves the non-AI endpoints open on the free plan", async () => {
    testEnv.PREMIUM_EMAILS = "someone-else@example.com";
    const created = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "無料でも作れる", tags: ["手書き"] }),
    });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number; tags: string[] } };
    // User tags survive; only the AI auto-tag step is skipped.
    expect(item.tags).toEqual(["手書き"]);

    const comment = await api(`/ideas/${item.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "無料コメント" }),
    });
    expect(comment.status).toBe(201);

    const list = await api("/ideas");
    expect(list.status).toBe(200);
  });

  it("still gates the AI endpoints behind the session itself", async () => {
    const response = await exports.default.fetch("https://example.com/api/ideas/1/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(401);
  });

  it("entitles the configured email", async () => {
    testEnv.PREMIUM_EMAILS = TEST_USER_EMAIL;
    const created = await api("/ideas", { method: "POST", body: JSON.stringify({ body: "有料" }) });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number } };
    const response = await api(`/ideas/${item.id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    // Workers AI is not bound in tests, so this fails downstream — but not with 402.
    expect(response.status).not.toBe(402);
  });
});
