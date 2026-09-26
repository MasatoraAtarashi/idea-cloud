/** Client-side helpers for the Stripe endpoints. Card data never touches this app. */

import type { Dictionary } from "../i18n/dictionary";

export const BILLING_STATUS_PATH = "/api/billing";
export const BILLING_CHECKOUT_PATH = "/api/billing/checkout";
export const BILLING_PORTAL_PATH = "/api/billing/portal";

export type BillingStatus = {
  plan: "free" | "premium";
  status: string;
  currentPeriodEnd: string | null;
  comped: boolean;
  billingLive: boolean;
  manageable: boolean;
};

/**
 * Asks the Worker for a Stripe-hosted URL and hands the browser over. Returns a
 * localised message on failure; on success the caller is already navigating.
 * The Worker's own `error` field is still server-side copy.
 */
export async function startBilling(t: Dictionary, path: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { accept: "application/json" } });
  } catch {
    return t.ai.billing.failed;
  }
  const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !body.url) {
    return body.error ?? t.ai.billing.failed;
  }
  window.location.assign(body.url);
  return null;
}
