/** Client-side helpers for the Stripe endpoints. Card data never touches this app. */

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

export const BILLING_NOT_READY = "課金は準備中です。";
export const BILLING_FAILED = "決済ページを開けませんでした。時間をおいて再度お試しください。";

/**
 * Asks the Worker for a Stripe-hosted URL and hands the browser over. Returns a
 * Japanese message on failure; on success the caller is already navigating.
 */
export async function startBilling(path: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { accept: "application/json" } });
  } catch {
    return BILLING_FAILED;
  }
  const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !body.url) {
    return body.error ?? BILLING_FAILED;
  }
  window.location.assign(body.url);
  return null;
}
