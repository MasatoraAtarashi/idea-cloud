import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { billingEvents, entitlements, type Entitlement } from "./schema";

export type { Entitlement };

/**
 * Stripe statuses that keep the AI features on. `past_due` is included on
 * purpose: Stripe retries a failed payment for days, and cutting a paying
 * customer off mid-period on the first failed charge is worse than the few
 * days of access. `current_period_end` still bounds it.
 */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getEntitlement(db: Db, email: string): Promise<Entitlement | undefined> {
  const [row] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.email, normalizeEmail(email)))
    .limit(1);
  return row;
}

export async function getEntitlementByCustomer(
  db: Db,
  stripeCustomerId: string,
): Promise<Entitlement | undefined> {
  const [row] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return row;
}

/** True while the row grants premium. `now` is injectable so tests are not clock-bound. */
export function isEntitlementActive(row: Entitlement | undefined, now = new Date()): boolean {
  if (!row) return false;
  if (row.plan !== "premium") return false;
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  if (!row.currentPeriodEnd) return row.status !== "past_due";
  const end = Date.parse(row.currentPeriodEnd);
  if (Number.isNaN(end)) return true;
  return end > now.getTime();
}

export type EntitlementUpdate = {
  email: string;
  plan?: "free" | "premium";
  status?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
};

/** Upsert by email. Fields left out keep their stored value. */
export async function upsertEntitlement(db: Db, update: EntitlementUpdate): Promise<Entitlement> {
  const email = normalizeEmail(update.email);
  const existing = await getEntitlement(db, email);
  const row = {
    email,
    plan: update.plan ?? existing?.plan ?? "free",
    status: update.status ?? existing?.status ?? "inactive",
    stripeCustomerId:
      update.stripeCustomerId !== undefined
        ? update.stripeCustomerId
        : (existing?.stripeCustomerId ?? null),
    stripeSubscriptionId:
      update.stripeSubscriptionId !== undefined
        ? update.stripeSubscriptionId
        : (existing?.stripeSubscriptionId ?? null),
    currentPeriodEnd:
      update.currentPeriodEnd !== undefined
        ? update.currentPeriodEnd
        : (existing?.currentPeriodEnd ?? null),
    updatedAt: nowIso(),
  };
  if (existing) {
    await db.update(entitlements).set(row).where(eq(entitlements.email, email));
  } else {
    await db.insert(entitlements).values(row);
  }
  return row;
}

/**
 * Records a Stripe event id. Returns false when it was already recorded, which
 * is how a retried delivery is skipped instead of applied twice.
 */
export async function claimBillingEvent(db: Db, id: string, type: string): Promise<boolean> {
  try {
    await db.insert(billingEvents).values({ id, type, receivedAt: nowIso() });
    return true;
  } catch {
    return false;
  }
}
