import { createRootDb, type RootDb } from "../../db/client";
import { getEntitlement, isEntitlementActive } from "../../db/entitlements";
import { parseAllowlist } from "../security/allowlist";
import { isBillingLive } from "./stripe";

/**
 * Plan / entitlement resolution — the one place that decides who may spend AI
 * budget. Feature code only ever asks `isPremium()`.
 *
 * Order:
 *   1. no session                      → free
 *   2. email listed in PREMIUM_EMAILS  → premium (owner / comped, no Stripe needed)
 *   3. Stripe not configured           → premium (billing is not live; pre-launch)
 *   4. active row in `entitlements`    → premium (written by the Stripe webhook)
 *   5. otherwise                       → free
 *
 * Stripe stays the source of truth; the table is its cached answer, so there is
 * still no user table. See docs/spec/billing.md.
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
  return parseAllowlist(csv);
}

/** Comped access that needs no subscription. Checked before Stripe. */
export function isCompedEmail(email: string | null | undefined, env: Env): boolean {
  if (!email?.trim()) return false;
  return parsePremiumEmails(env.PREMIUM_EMAILS).includes(email.trim().toLowerCase());
}

export async function resolvePlan(
  db: RootDb,
  email: string | null | undefined,
  env: Env,
  now = new Date(),
): Promise<Plan> {
  if (!email?.trim()) return "free";
  if (isCompedEmail(email, env)) return "premium";
  if (!isBillingLive(env)) return "premium";
  return isEntitlementActive(await getEntitlement(db, email), now) ? "premium" : "free";
}

export async function isPremium(
  db: RootDb,
  email: string | null | undefined,
  env: Env,
  now = new Date(),
): Promise<boolean> {
  return (await resolvePlan(db, email, env, now)) === "premium";
}

/** Convenience for call sites that hold `env` but no `Db` yet. */
export async function resolvePlanForEnv(
  email: string | null | undefined,
  env: Env,
  now = new Date(),
): Promise<Plan> {
  if (!email?.trim()) return "free";
  if (isCompedEmail(email, env)) return "premium";
  if (!isBillingLive(env)) return "premium";
  return resolvePlan(createRootDb(env.DB), email, env, now);
}
