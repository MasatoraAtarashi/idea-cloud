import { Hono } from "hono";
import { apiDb } from "../db";
import { getEntitlement, isEntitlementActive } from "../../../db/entitlements";
import { isCompedEmail, resolvePlan } from "../../billing/plan";
import {
  createCheckoutSession,
  createPortalSession,
  stripeConfig,
  StripeError,
} from "../../billing/stripe";
import { logDiag } from "../../diag";
import type { AppEnv } from "../../env";

/**
 * Subscription entry points. Checkout and the portal are hosted by Stripe, so
 * no card data reaches this Worker. Mounted inside `/api`, behind sessionAuth —
 * the webhook is mounted separately in workers/app.ts because Stripe has no
 * session.
 */

/** Where Stripe sends the browser back. Always this origin, never user input. */
function appUrl(requestUrl: string, path: string): string {
  return new URL(path, new URL(requestUrl).origin).toString();
}

export const billingRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = apiDb(c);
    const email = c.get("userEmail");
    const row = await getEntitlement(db, email);
    return c.json({
      plan: await resolvePlan(db, email, c.env),
      status: row?.status ?? "none",
      currentPeriodEnd: row?.currentPeriodEnd ?? null,
      comped: isCompedEmail(email, c.env),
      billingLive: stripeConfig(c.env) !== null,
      manageable: Boolean(row?.stripeCustomerId),
    });
  })
  .post("/checkout", async (c) => {
    const config = stripeConfig(c.env);
    if (!config) return c.json({ error: "課金は準備中です。" }, 503);
    const email = c.get("userEmail");
    const db = apiDb(c);
    if (isEntitlementActive(await getEntitlement(db, email))) {
      return c.json({ error: "すでにプレミアムです。" }, 409);
    }
    try {
      const url = await createCheckoutSession({
        config,
        email,
        successUrl: appUrl(c.req.url, "/app/settings?billing=success"),
        cancelUrl: appUrl(c.req.url, "/app/settings?billing=cancelled"),
      });
      logDiag("info", "stripe checkout", { step: "billing", outcome: "success" });
      return c.json({ url });
    } catch (error) {
      const status = error instanceof StripeError ? error.status : 502;
      logDiag("warn", "stripe checkout", { step: "billing", outcome: "fail", status });
      return c.json({ error: "決済ページを開けませんでした。" }, 502);
    }
  })
  .post("/portal", async (c) => {
    const config = stripeConfig(c.env);
    if (!config) return c.json({ error: "課金は準備中です。" }, 503);
    const row = await getEntitlement(apiDb(c), c.get("userEmail"));
    if (!row?.stripeCustomerId) {
      return c.json({ error: "契約が見つかりません。" }, 409);
    }
    try {
      const url = await createPortalSession({
        config,
        customerId: row.stripeCustomerId,
        returnUrl: appUrl(c.req.url, "/app/settings"),
      });
      return c.json({ url });
    } catch {
      logDiag("warn", "stripe portal", { step: "billing", outcome: "fail" });
      return c.json({ error: "契約ページを開けませんでした。" }, 502);
    }
  });
