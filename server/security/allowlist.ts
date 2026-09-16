/**
 * Second layer after Google identity.
 * Production primary gate is in-app Google OAuth (mock on /login this pass).
 * Template Access middleware still sits in front of APIs until the OAuth swap.
 * Empty allowlist = identity provider only. Comma-separated emails, lowercase.
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
