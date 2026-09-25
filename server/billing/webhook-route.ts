import { Hono } from "hono";
import { createDb } from "../../db/client";
import { logDiag } from "../diag";
import type { AppEnv } from "../env";
import { stripeConfig, verifyStripeSignature } from "./stripe";
import { applyStripeEvent } from "./webhook";

/**
 * `POST /api/billing/webhook`. Mounted outside sessionAuth: the caller is
 * Stripe, and its only credential is the signature over the raw body. A body
 * that fails verification is dropped with 400 and never parsed as an event.
 */
export const billingWebhookRoute = new Hono<AppEnv>().post("/", async (c) => {
  const config = stripeConfig(c.env);
  if (!config) return c.json({ error: "not configured" }, 503);

  const rawBody = await c.req.text();
  const verified = await verifyStripeSignature({
    rawBody,
    header: c.req.header("stripe-signature") ?? null,
    secret: config.webhookSecret,
  });
  if (!verified) {
    logDiag("warn", "stripe webhook", { step: "billing", outcome: "fail", error: "bad_signature" });
    return c.json({ error: "invalid signature" }, 400);
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return c.json({ error: "invalid payload" }, 400);
  }

  try {
    const outcome = await applyStripeEvent(createDb(c.env.DB), event);
    return c.json({ received: true, applied: outcome.applied });
  } catch {
    // 5xx makes Stripe retry, which is what we want for a transient D1 error.
    logDiag("warn", "stripe webhook", { step: "billing", outcome: "fail", error: "apply_failed" });
    return c.json({ error: "apply failed" }, 500);
  }
});
