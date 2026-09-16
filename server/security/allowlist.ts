/**
 * Extra restriction after Cloudflare Access.
 * Empty allowlist defers entirely to the Access policy.
 * Comma-separated emails, compared lowercase.
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
