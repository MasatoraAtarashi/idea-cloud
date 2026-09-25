import type { Db } from "../../db/client";
import {
  claimBillingEvent,
  getEntitlementByCustomer,
  upsertEntitlement,
} from "../../db/entitlements";
import { logDiag } from "../diag";

/**
 * Applies the Stripe events that change access. Everything else is accepted and
 * ignored — Stripe sends far more than this app cares about, and answering 2xx
 * is what stops it retrying.
 *
 * The caller must have verified the signature first.
 */

export type WebhookOutcome =
  | { applied: true; email: string; plan: "free" | "premium" }
  | { applied: false; reason: "duplicate" | "ignored" | "no_email" };

type Json = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Stripe sends unix seconds; the table stores ISO so it is readable in `d1 execute`. */
function isoFromUnix(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function object(event: Json): Json {
  const data = event.data as Json | undefined;
  const obj = data?.object as Json | undefined;
  return obj ?? {};
}

/** A subscription id can arrive as a string or as an expanded object. */
function idOf(value: unknown): string | null {
  if (typeof value === "string") return str(value);
  if (value && typeof value === "object") return str((value as Json).id);
  return null;
}

function emailFromCheckout(session: Json): string | null {
  const details = session.customer_details as Json | undefined;
  const metadata = session.metadata as Json | undefined;
  return (
    str(session.client_reference_id) ??
    str(metadata?.email) ??
    str(session.customer_email) ??
    str(details?.email)
  );
}

/** Premium while Stripe says the subscription is live; `past_due` keeps access to period end. */
const PREMIUM_STATUSES = new Set(["active", "trialing", "past_due"]);

async function emailForSubscription(db: Db, subscription: Json): Promise<string | null> {
  const metadata = subscription.metadata as Json | undefined;
  const fromMetadata = str(metadata?.email);
  if (fromMetadata) return fromMetadata;
  const customerId = idOf(subscription.customer);
  if (!customerId) return null;
  const row = await getEntitlementByCustomer(db, customerId);
  return row?.email ?? null;
}

function periodEnd(subscription: Json): string | null {
  const direct = isoFromUnix(subscription.current_period_end);
  if (direct) return direct;
  // Newer API versions moved the period onto the subscription item.
  const items = subscription.items as Json | undefined;
  const data = Array.isArray(items?.data) ? (items.data as Json[]) : [];
  return isoFromUnix(data[0]?.current_period_end);
}

export async function applyStripeEvent(db: Db, event: Json): Promise<WebhookOutcome> {
  const id = str(event.id);
  const type = str(event.type) ?? "unknown";
  if (!id) return { applied: false, reason: "ignored" };
  if (!(await claimBillingEvent(db, id, type))) {
    logDiag("info", "stripe webhook", { step: "billing", outcome: "skipped", reason: "duplicate" });
    return { applied: false, reason: "duplicate" };
  }

  const obj = object(event);

  if (type === "checkout.session.completed") {
    if (str(obj.mode) !== "subscription") return { applied: false, reason: "ignored" };
    const email = emailFromCheckout(obj);
    if (!email) {
      logDiag("warn", "stripe webhook", { step: "billing", outcome: "fail", error: "no_email" });
      return { applied: false, reason: "no_email" };
    }
    // The subscription.* event that follows fills in status and period end.
    await upsertEntitlement(db, {
      email,
      plan: "premium",
      status: "active",
      stripeCustomerId: idOf(obj.customer),
      stripeSubscriptionId: idOf(obj.subscription),
    });
    logDiag("info", "stripe webhook", { step: "billing", outcome: "success", event: type });
    return { applied: true, email, plan: "premium" };
  }

  if (
    type === "customer.subscription.created" ||
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted"
  ) {
    const email = await emailForSubscription(db, obj);
    if (!email) {
      logDiag("warn", "stripe webhook", { step: "billing", outcome: "fail", error: "no_email" });
      return { applied: false, reason: "no_email" };
    }
    const status = str(obj.status) ?? "canceled";
    const live = type !== "customer.subscription.deleted" && PREMIUM_STATUSES.has(status);
    await upsertEntitlement(db, {
      email,
      plan: live ? "premium" : "free",
      status: type === "customer.subscription.deleted" ? "canceled" : status,
      stripeCustomerId: idOf(obj.customer),
      stripeSubscriptionId: idOf(obj.id),
      currentPeriodEnd: periodEnd(obj),
    });
    logDiag("info", "stripe webhook", { step: "billing", outcome: "success", event: type });
    return { applied: true, email, plan: live ? "premium" : "free" };
  }

  return { applied: false, reason: "ignored" };
}
