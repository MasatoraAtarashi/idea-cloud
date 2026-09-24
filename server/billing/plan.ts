/**
 * Plan / entitlement resolution. One seam so a billing SaaS can be dropped in
 * later without touching feature code: every caller asks `isPremium(email, env)`
 * and nothing else knows how the answer is produced.
 *
 * Today the answer comes from `PREMIUM_EMAILS` (same shape and fail-open rule as
 * ACCESS_ALLOWED_EMAILS: empty = no gate yet, so a solo owner cannot lock
 * themselves out before billing exists). When Stripe (or similar) is wired,
 * `resolvePlan` becomes the only place that reads the entitlement — there is
 * still no user table; Stripe keys its customer by the Google email.
 *
 * Payment itself is deliberately not implemented here. See docs/spec/billing.md.
 */

export const PLANS = ["free", "premium"] as const;
export type Plan = (typeof PLANS)[number];

/** Everything that spends AI budget: AI 作業台 (相談/評価/リサーチ/ブレスト), auto-tags, Jev. */
export const PREMIUM_FEATURES = [
  "ai.discuss",
  "ai.evaluate",
  "ai.research",
  "ai.brainstorm",
  "ai.auto_tag",
] as const;

export const PREMIUM_REQUIRED_MESSAGE = "AI機能はプレミアムプランでご利用いただけます。";
/** Payment Required. Distinguishes "signed in but not entitled" from 403. */
export const PREMIUM_REQUIRED_STATUS = 402;

export function parsePremiumEmails(csv: string | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * `null` email (no session) is always free. With PREMIUM_EMAILS unset every
 * signed-in member is premium; setting it turns the list into the entitlement.
 */
export function resolvePlan(email: string | null | undefined, env: Env): Plan {
  if (!email?.trim()) return "free";
  const premium = parsePremiumEmails(env.PREMIUM_EMAILS);
  if (premium.length === 0) return "premium";
  return premium.includes(email.trim().toLowerCase()) ? "premium" : "free";
}

export function isPremium(email: string | null | undefined, env: Env): boolean {
  return resolvePlan(email, env) === "premium";
}
