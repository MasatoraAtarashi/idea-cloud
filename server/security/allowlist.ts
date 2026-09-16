/**
 * Cloudflare Access 通過後の追加制限。
 * 未設定（空）のときは Access のポリシーだけに委譲する。
 * カンマ区切りのメールを小文字比較する。
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
