import { timingSafeEqualString } from "../mcp/auth";

/**
 * Stripe over `fetch`. No SDK: the Worker only needs three REST calls and one
 * signature check, and card data never touches this origin — Checkout and the
 * Billing Portal are hosted by Stripe.
 */

const STRIPE_API = "https://api.stripe.com/v1";
/** Stripe replays a delivery for days; anything older than this is not fresh. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type StripeConfig = {
  secretKey: string;
  priceId: string;
  webhookSecret: string;
};

/** `null` until every Stripe secret is set: billing is then simply not live. */
export function stripeConfig(env: Env): StripeConfig | null {
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const priceId = env.STRIPE_PRICE_ID?.trim() ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!secretKey || !priceId || !webhookSecret) return null;
  return { secretKey, priceId, webhookSecret };
}

export function isBillingLive(env: Env): boolean {
  return stripeConfig(env) !== null;
}

export class StripeError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

async function stripePost(
  secretKey: string,
  path: string,
  form: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    // Stripe's message can quote customer input; the status is what we act on.
    throw new StripeError(response.status, `stripe ${path} ${response.status}`);
  }
  return payload;
}

/**
 * Hosted Checkout for the single subscription price. The Google email is both
 * `customer_email` and `client_reference_id`, so the webhook can key the
 * entitlement without a user table.
 */
export async function createCheckoutSession(opts: {
  config: StripeConfig;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const payload = await stripePost(opts.config.secretKey, "/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": opts.config.priceId,
    "line_items[0][quantity]": "1",
    customer_email: opts.email,
    client_reference_id: opts.email,
    "subscription_data[metadata][email]": opts.email,
    "metadata[email]": opts.email,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: "true",
  });
  const url = typeof payload.url === "string" ? payload.url : "";
  if (!url) throw new StripeError(502, "stripe checkout returned no url");
  return url;
}

/** Stripe-hosted portal: payment method, invoices, cancellation. */
export async function createPortalSession(opts: {
  config: StripeConfig;
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const payload = await stripePost(opts.config.secretKey, "/billing_portal/sessions", {
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
  const url = typeof payload.url === "string" ? payload.url : "";
  if (!url) throw new StripeError(502, "stripe portal returned no url");
  return url;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** `t=1699999999,v1=abc,v1=def` → timestamp plus every v1 candidate. */
export function parseStripeSignature(header: string): { timestamp: number; v1: string[] } | null {
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      timestamp = parsed;
    } else if (key === "v1" && value) {
      v1.push(value);
    }
  }
  if (timestamp == null || v1.length === 0) return null;
  return { timestamp, v1 };
}

/**
 * Verifies `Stripe-Signature` against the raw request body. Must run on the
 * exact bytes Stripe signed, so the caller reads the body as text and parses
 * JSON only after this returns true.
 */
export async function verifyStripeSignature(opts: {
  rawBody: string;
  header: string | null;
  secret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): Promise<boolean> {
  if (!opts.header) return false;
  const parsed = parseStripeSignature(opts.header);
  if (!parsed) return false;
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
  if (Math.abs(now - parsed.timestamp) > tolerance) return false;
  const expected = await hmacHex(opts.secret, `${parsed.timestamp}.${opts.rawBody}`);
  return parsed.v1.some((candidate) => timingSafeEqualString(candidate, expected));
}
