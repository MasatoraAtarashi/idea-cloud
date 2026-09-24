/**
 * Membership: the second layer after the in-app Google OAuth identity, checked
 * on every request by the page gate and by `/api`'s sessionAuth.
 * Empty allowlist = identity provider only. Comma-separated emails, lowercase.
 * Entitlement (free / premium) is a separate question: server/billing/plan.ts.
 */
export function parseAllowlist(allowlistCsv: string | undefined): string[] {
  if (!allowlistCsv) return [];
  return allowlistCsv
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isEmailAllowed(email: string, allowlistCsv: string | undefined): boolean {
  const allowlist = parseAllowlist(allowlistCsv);
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.trim().toLowerCase());
}
