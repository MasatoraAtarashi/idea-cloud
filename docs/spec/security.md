# Security posture

Closed team. Least privilege. No secrets in git.

**Production primary gate: in-app Google OAuth.** Second layer: email allowlist. Template Cloudflare Access middleware is still in the Worker until the OAuth swap; it is **not** the product auth model.

## Google auth + allowlist

Two layers. Do not treat them as the same feature.

| Layer                            | Mechanism                                                                                                          | Status                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **In-app Google OAuth**          | Google identity + session inside the Worker. Login UI on `/login` matches Sign in with Google.                     | **Primary (decided).** UI is a mock this pass. Real OAuth is [oauth-swap.md](./oauth-swap.md). |
| **Allowlist**                    | `ACCESS_ALLOWED_EMAILS` (comma-separated, lowercase). Empty = Google identity only. Set = identity plus app `403`. | **Stub wired** on APIs (`server/security/allowlist.ts`)                                        |
| **Cloudflare Access** (template) | `Cf-Access-Authenticated-User-Email` middleware from `personal-fullstack`.                                         | **Remove in follow-up.** Do not block screenshots on this.                                     |

Local bypass: `LOCAL_DEV_USER_EMAIL` on `localhost` / `127.0.0.1` only (still used because OAuth is unwired). Missing identity in production APIs → `401` (today: missing Access header).

Team settings show the allowlist in a **disabled** textarea so the mock cannot pretend to write secrets.

Do not invent OAuth client secrets. Production: `wrangler secret` / GitHub secrets only. Do not log `TYPESAFE_API_KEY` or `MCP_API_KEY`.

## Remote MCP

`/mcp` is a shared-secret API for agents. See [mcp.md](./mcp.md).

| Item             | Rule                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Secret           | `MCP_API_KEY` (`MCP_TOKEN` only when the first is unset). `.dev.vars` locally, `wrangler secret put MCP_API_KEY` in production. Never in git. |
| Request          | `Authorization: Bearer <secret>`. Missing, blank, or wrong token → `401`. Unset secret → `401` for every call.                                |
| Not a substitute | Cloudflare Access email and the mock Google session do not authorize `/mcp`. `/api/*` still uses Access middleware.                           |
| Access in front  | If Zero Trust covers the hostname, bypass `/mcp` or clients never reach the bearer check.                                                     |
| Logging          | Do not log the token or `Authorization`.                                                                                                      |

## Field encryption

`server/security/field-crypto.ts`: AES-GCM, 12-byte IV, `base64(iv).base64(ciphertext)`.

- Key: `FIELD_ENCRYPTION_KEY` — 32-byte hex (64 chars), wrangler secret / `.dev.vars` only.
- **Not wired to D1.** The `ideas` table stores plaintext `title` / `body`. Tests cover round-trip + bad key.
- Do not log plaintext bodies. Do not put the key in `wrangler.jsonc`.

## CI security

`.github/workflows/pr.yml` on every PR:

| Check                   | Why                                    |
| ----------------------- | -------------------------------------- |
| typecheck / lint / test | Catch breaks before merge              |
| gitleaks                | Stop committed secrets                 |
| zizmor                  | GitHub Actions audit                   |
| pnpm audit              | Dependency CVEs (`--audit-level=high`) |
| ASH                     | Additional static checks               |

Also: Dependabot, lefthook (local), security headers middleware (`x-content-type-options`, `x-frame-options`, referrer-policy). Deploy uses a least-privilege API token, not a hardcoded credential.

## Headers / CORS

Same-origin UI. No wide CORS on APIs. `/` and `/login` are the unauthenticated login gate. `/app` is behind the mock Google continue (real OAuth later).

## Outbound OGP fetch

When an inspiration URL is saved from the gallery or API (create/update/再取得), the Worker fetches the HTML to read Open Graph / Twitter meta. Idea-body URL upsert does not fetch at save time. The page URL (and every redirect hop) must be public http(s): no credentials, no localhost / `.local` / `.internal`, no private or link-local IPs (including `169.254.169.254`). Timeout 5s, HTML cap 512KB, max 3 redirects. `og:image` is stored only if it is public **https**. Fetch failure is fail-soft (`og_status=failed`); it must not fail idea/inspiration save. Images are hotlinked in the UI; there is no open image proxy.
