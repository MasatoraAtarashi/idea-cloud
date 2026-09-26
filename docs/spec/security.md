# Security posture

Least privilege. No secrets in git. Tenancy (who sees which ideas) is a fourth layer on top of identity, allowlist and entitlement: [workspaces.md](./workspaces.md).

**Primary gate: in-app Google OAuth** (implemented — [oauth-swap.md](./oauth-swap.md)). Second layer: email allowlist. The template Cloudflare Access middleware has been removed.

## Google auth + allowlist

Two layers. Do not treat them as the same feature.

| Layer                            | Mechanism                                                                                                                                  | Status                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **In-app Google OAuth**          | Authorization code + PKCE on the Worker; signed httpOnly `ic_session` cookie. `/login` starts it.                                          | **Primary, implemented.** `server/auth/`                                             |
| **Allowlist**                    | `ACCESS_ALLOWED_EMAILS` (comma-separated, lowercase). Empty = Google identity only (public deploy). Set = identity plus app `403`.         | **Wired** on pages and APIs, re-checked per request (`server/security/allowlist.ts`) |
| **Workspace**                    | Membership row in `workspace_members`; every tenant query filters by the request's workspace. `ic_ws` cookie only picks among memberships. | **Wired** (`server/tenant/workspace.ts`, `db/client.ts` `Db.workspaceId`)            |
| **App token**                    | `Authorization: Bearer <APP_API_TOKEN>` for the native app / scripts, attributed to `APP_API_TOKEN_EMAIL`.                                 | **Wired** (`server/auth/principal.ts`). Optional — unset means cookie-only           |
| **Cloudflare Access** (template) | `Cf-Access-Authenticated-User-Email` middleware from `personal-fullstack`.                                                                 | **Removed.** A native client cannot hold an Access session, so it is not the gate.   |

Local bypass: `LOCAL_DEV_USER_EMAIL` on `localhost` / `127.0.0.1` only, and only while no Google client is configured (dev + Playwright). Unreachable on a real hostname. Missing credential on `/api/*` → `401`; identity outside the allowlist → `403` with no session set.

Entitlement is a third, separate layer: a member without the premium plan still passes `401`/`403` and is refused only on the AI endpoints, with `402`. Membership says who is in; the plan says what they may spend. See [billing.md](./billing.md).

`POST /api/billing/webhook` is the one route outside the session gate. Its credential is Stripe's `Stripe-Signature` over the **raw** body: HMAC-SHA256 of `${t}.${body}`, constant-time compare, 300 s timestamp tolerance, and the body is not parsed until it verifies. Replays are dropped by event id (`billing_events`). No Stripe secret is logged, and card data never reaches this origin — Checkout and the portal are Stripe-hosted.

Sessions are self-contained cookies with no `sessions` table: rotate `SESSION_SECRET` to revoke everything at once. Per-device sign-out is not built.

Settings never show or edit env secrets. Members, invites and MCP keys are D1 rows managed in 設定; owner-only writes are re-checked on the server.

Do not invent OAuth client secrets. Production: `wrangler secret` / GitHub secrets only. Do not log `TYPESAFE_API_KEY`, `MCP_API_KEY`, or `SEARCH_API_KEY`.

## Remote MCP

`/mcp` authenticates with a per-workspace key (`icw_…`, stored as SHA-256, revocable in 設定) and is scoped to that workspace. The env shared secret is legacy and opens workspace 1 only. See [mcp.md](./mcp.md).

| Item             | Rule                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential       | Workspace key from 設定 → API キー（MCP）, hashed at rest. Legacy: `MCP_API_KEY` (`MCP_TOKEN` only when the first is unset) → workspace 1. Never in git. |
| Request          | `Authorization: Bearer <secret>`. Missing, blank, or wrong token → `401`. Unset secret → `401` for every call.                                           |
| Not a substitute | A browser session cookie does not authorize `/mcp`, and `MCP_API_KEY` does not authorize `/api/*`.                                                       |
| Access in front  | If Zero Trust covers the hostname, bypass `/mcp` or clients never reach the bearer check.                                                                |
| Logging          | Do not log the token or `Authorization`.                                                                                                                 |

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

Same-origin UI. No wide CORS on APIs. `/` and `/login` are the unauthenticated login gate; `/app/**` requires a session (`server/auth/page-gate.ts`). The session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` off localhost.

## Outbound OGP fetch

When an inspiration URL is saved from the gallery or API (create/update/再取得), the Worker fetches the HTML to read Open Graph / Twitter meta. Idea-body URL upsert does not fetch at save time. The page URL (and every redirect hop) must be public http(s): no credentials, no localhost / `.local` / `.internal`, no private or link-local IPs (including `169.254.169.254`). Timeout 5s, HTML cap 512KB, max 3 redirects. `og:image` is stored only if it is public **https**. Fetch failure is fail-soft (`og_status=failed`); it must not fail idea/inspiration save. Images are hotlinked in the UI; there is no open image proxy.

## Outbound research web search

Per-idea **リサーチ** fetches a few public search-result pages (DuckDuckGo HTML, Bing HTML, DuckDuckGo Instant Answer JSON) or Brave Search (`SEARCH_API_KEY`, wrangler secret / `.dev.vars` only). Result URLs are kept only when they are public http(s) and not search-engine hosts; private/localhost URLs are dropped. Timeout 5s, HTML cap 256KB. Search failure must not fail the research action: persist notes and show **Web検索未取得**. Do not log the Brave key. Do not invent citations.
