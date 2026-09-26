import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import { createDb } from "../db/client";
import {
  getEntitlement,
  isEntitlementActive,
  upsertEntitlement,
  type Entitlement,
} from "../db/entitlements";
import {
  isCompedEmail,
  PREMIUM_REQUIRED_MESSAGE,
  resolvePlan,
  resolvePlanForEnv,
} from "../server/billing/plan";
import {
  isBillingLive,
  parseStripeSignature,
  verifyStripeSignature,
} from "../server/billing/stripe";
import { applyStripeEvent } from "../server/billing/webhook";
import { authHeaders, testEnv, TEST_USER_EMAIL, TEST_WORKSPACE_ID } from "./auth-helper";

const COMPED = testEnv.PREMIUM_EMAILS!;
const PAYING = "payer@example.com";

function db() {
  return createDb(env.DB, TEST_WORKSPACE_ID);
}

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

/** Sign a body the way Stripe does: HMAC-SHA256 over `${t}.${rawBody}`. */
async function stripeSignature(rawBody: string, secret: string, timestamp: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

async function postWebhook(event: unknown, opts?: { secret?: string; timestamp?: number }) {
  const raw = JSON.stringify(event);
  const timestamp = opts?.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = await stripeSignature(
    raw,
    opts?.secret ?? testEnv.STRIPE_WEBHOOK_SECRET!,
    timestamp,
  );
  return exports.default.fetch("https://example.com/api/billing/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: raw,
  });
}

function subscriptionEvent(opts: {
  id: string;
  type: string;
  email?: string;
  status: string;
  customer?: string;
  periodEnd?: number;
}) {
  return {
    id: opts.id,
    type: opts.type,
    data: {
      object: {
        id: "sub_1",
        object: "subscription",
        customer: opts.customer ?? "cus_1",
        status: opts.status,
        metadata: opts.email ? { email: opts.email } : {},
        current_period_end: opts.periodEnd ?? Math.floor(Date.now() / 1000) + 86_400 * 30,
      },
    },
  };
}

afterEach(async () => {
  testEnv.PREMIUM_EMAILS = COMPED;
});

describe("entitlement rows", () => {
  const base: Entitlement = {
    email: PAYING,
    plan: "premium",
    status: "active",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    currentPeriodEnd: null,
    updatedAt: "2026-09-25T00:00:00.000Z",
  };
  const now = new Date("2026-09-25T00:00:00.000Z");

  it("grants premium while the subscription is live", () => {
    expect(isEntitlementActive(undefined, now)).toBe(false);
    expect(isEntitlementActive(base, now)).toBe(true);
    expect(isEntitlementActive({ ...base, status: "trialing" }, now)).toBe(true);
    expect(isEntitlementActive({ ...base, plan: "free" }, now)).toBe(false);
    expect(isEntitlementActive({ ...base, status: "canceled" }, now)).toBe(false);
    expect(isEntitlementActive({ ...base, status: "incomplete_expired" }, now)).toBe(false);
  });

  it("stops at the paid-through date", () => {
    const future = { ...base, currentPeriodEnd: "2026-10-25T00:00:00.000Z" };
    const past = { ...base, currentPeriodEnd: "2026-09-01T00:00:00.000Z" };
    expect(isEntitlementActive(future, now)).toBe(true);
    expect(isEntitlementActive(past, now)).toBe(false);
  });

  it("keeps a past_due subscription until the period it was paid for ends", () => {
    const retrying = { ...base, status: "past_due", currentPeriodEnd: "2026-10-25T00:00:00.000Z" };
    expect(isEntitlementActive(retrying, now)).toBe(true);
    expect(isEntitlementActive({ ...retrying, currentPeriodEnd: null }, now)).toBe(false);
  });
});

describe("plan resolution", () => {
  it("is free without a session", async () => {
    expect(await resolvePlan(db(), null, testEnv)).toBe("free");
    expect(await resolvePlan(db(), "  ", testEnv)).toBe("free");
  });

  it("comps the emails in PREMIUM_EMAILS without any Stripe row", async () => {
    expect(isCompedEmail(TEST_USER_EMAIL, testEnv)).toBe(true);
    expect(isCompedEmail(TEST_USER_EMAIL.toUpperCase(), testEnv)).toBe(true);
    expect(isCompedEmail("stranger@example.com", testEnv)).toBe(false);
    expect(await resolvePlan(db(), TEST_USER_EMAIL, testEnv)).toBe("premium");
  });

  it("falls back to premium for everyone only while Stripe is unconfigured", async () => {
    const unconfigured = { ...testEnv, PREMIUM_EMAILS: "", STRIPE_SECRET_KEY: "" } as Env;
    expect(isBillingLive(unconfigured)).toBe(false);
    expect(await resolvePlan(db(), "stranger@example.com", unconfigured)).toBe("premium");
    expect(isBillingLive(testEnv)).toBe(true);
  });

  it("reads the entitlements table once billing is live", async () => {
    testEnv.PREMIUM_EMAILS = "";
    expect(await resolvePlan(db(), PAYING, testEnv)).toBe("free");
    await upsertEntitlement(db(), {
      email: PAYING,
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2099-01-01T00:00:00.000Z",
    });
    expect(await resolvePlan(db(), PAYING, testEnv)).toBe("premium");
    expect(await resolvePlanForEnv(PAYING, testEnv)).toBe("premium");

    await upsertEntitlement(db(), { email: PAYING, plan: "free", status: "canceled" });
    expect(await resolvePlan(db(), PAYING, testEnv)).toBe("free");
  });
});

describe("stripe webhook", () => {
  it("rejects a missing, forged, or stale signature without parsing the body", async () => {
    const event = subscriptionEvent({
      id: "evt_reject",
      type: "customer.subscription.created",
      email: "nope@example.com",
      status: "active",
    });

    const unsigned = await exports.default.fetch("https://example.com/api/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    expect(unsigned.status).toBe(400);

    const forged = await postWebhook(event, { secret: "whsec_not_ours" });
    expect(forged.status).toBe(400);

    const stale = await postWebhook(event, { timestamp: Math.floor(Date.now() / 1000) - 3_600 });
    expect(stale.status).toBe(400);

    expect(await getEntitlement(db(), "nope@example.com")).toBeUndefined();
  });

  it("parses the signature header and accepts any matching v1", async () => {
    expect(parseStripeSignature("nonsense")).toBeNull();
    expect(parseStripeSignature("t=1,v0=abc")).toBeNull();
    expect(parseStripeSignature("t=1,v1=abc,v1=def")).toEqual({ timestamp: 1, v1: ["abc", "def"] });

    const raw = JSON.stringify({ id: "evt_x" });
    const header = await stripeSignature(raw, "whsec_test", 1_700_000_000);
    const withExtra = `${header},v1=deadbeef`;
    await expect(
      verifyStripeSignature({
        rawBody: raw,
        header: withExtra,
        secret: "whsec_test",
        nowSeconds: 1_700_000_000,
      }),
    ).resolves.toBe(true);
    await expect(
      verifyStripeSignature({
        rawBody: `${raw} `,
        header: withExtra,
        secret: "whsec_test",
        nowSeconds: 1_700_000_000,
      }),
    ).resolves.toBe(false);
  });

  it("grants premium on checkout and revokes it on cancellation", async () => {
    const email = "lifecycle@example.com";
    const checkout = await postWebhook({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          object: "checkout.session",
          mode: "subscription",
          client_reference_id: email,
          customer: "cus_life",
          subscription: "sub_life",
        },
      },
    });
    expect(checkout.status).toBe(200);
    testEnv.PREMIUM_EMAILS = "";
    expect(await resolvePlan(db(), email, testEnv)).toBe("premium");

    const renewed = await postWebhook(
      subscriptionEvent({
        id: "evt_updated",
        type: "customer.subscription.updated",
        status: "active",
        customer: "cus_life",
        periodEnd: 4_102_444_800,
      }),
    );
    expect(renewed.status).toBe(200);
    const stored = await getEntitlement(db(), email);
    expect(stored?.currentPeriodEnd).toBe("2100-01-01T00:00:00.000Z");
    expect(stored?.stripeCustomerId).toBe("cus_life");

    const cancelled = await postWebhook(
      subscriptionEvent({
        id: "evt_deleted",
        type: "customer.subscription.deleted",
        status: "canceled",
        customer: "cus_life",
      }),
    );
    expect(cancelled.status).toBe(200);
    expect(await resolvePlan(db(), email, testEnv)).toBe("free");
  });

  it("applies a retried delivery only once", async () => {
    const email = "retry@example.com";
    const event = subscriptionEvent({
      id: "evt_retry",
      type: "customer.subscription.created",
      email,
      status: "active",
    });
    expect((await postWebhook(event)).status).toBe(200);
    await upsertEntitlement(db(), { email, plan: "free", status: "canceled" });
    // A duplicate delivery must not resurrect the row we just changed.
    const second = await postWebhook(event);
    expect(second.status).toBe(200);
    expect((await second.json()) as { applied: boolean }).toEqual({
      received: true,
      applied: false,
    });
    expect((await getEntitlement(db(), email))?.plan).toBe("free");
  });

  it("ignores events it does not act on", async () => {
    const outcome = await applyStripeEvent(db(), {
      id: "evt_ignored",
      type: "invoice.created",
      data: { object: {} },
    });
    expect(outcome).toEqual({ applied: false, reason: "ignored" });
  });
});

describe("premium gate on /api", () => {
  it("answers 402 on the AI endpoints for a member without the plan", async () => {
    const created = await api("/ideas", { method: "POST", body: JSON.stringify({ body: "課金" }) });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number } };

    testEnv.PREMIUM_EMAILS = "";
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
    testEnv.PREMIUM_EMAILS = "";
    const created = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "無料でも作れる", tags: ["手書き"] }),
    });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number; tags: string[] } };
    expect(item.tags).toEqual(["手書き"]);

    const comment = await api(`/ideas/${item.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "無料コメント" }),
    });
    expect(comment.status).toBe(201);
    expect((await api("/ideas")).status).toBe(200);
  });

  it("still requires a session before it considers the plan", async () => {
    const response = await exports.default.fetch("https://example.com/api/ideas/1/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(401);
  });
});

describe("billing endpoints", () => {
  it("reports the caller's plan", async () => {
    const response = await api("/billing");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { plan: string; comped: boolean; billingLive: boolean };
    expect(body.plan).toBe("premium");
    expect(body.comped).toBe(true);
    expect(body.billingLive).toBe(true);
  });

  it("refuses checkout for someone who already pays, and the portal without a customer", async () => {
    testEnv.PREMIUM_EMAILS = "";
    await upsertEntitlement(db(), {
      email: TEST_USER_EMAIL,
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2099-01-01T00:00:00.000Z",
      stripeCustomerId: null,
    });
    expect((await api("/billing/checkout", { method: "POST" })).status).toBe(409);
    expect((await api("/billing/portal", { method: "POST" })).status).toBe(409);
    await upsertEntitlement(db(), { email: TEST_USER_EMAIL, plan: "free", status: "canceled" });
  });

  it("requires a session", async () => {
    const response = await exports.default.fetch("https://example.com/api/billing", {});
    expect(response.status).toBe(401);
  });
});
