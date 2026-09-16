# Security posture

Closed team. Least privilege. No secrets in git.

This pass **stubs** the intended posture: Google identity at the edge, an email allowlist, AES-GCM for fields, and the template security CI. Nothing here is a complete production auth product.

## Google auth + allowlist

Two layers. Do not treat them as the same feature.

| Layer | Mechanism | Status |
| --- | --- |
| **Google via Cloudflare Access** | Zero Trust app, Google IdP. Worker reads `Cf-Access-Authenticated-User-Email`. No OAuth client in app code. | **Now** — early gate for `/app` and `/api` |
| **Allowlist** | `ACCESS_ALLOWED_EMAILS` (comma-separated, lowercase). Empty = Access policy only. Set = Access plus app `403`. | **Stub wired** on APIs (`server/security/allowlist.ts`) |
| **In-app Google OAuth** | Sessions inside the Worker. | **Later** — not this pass |

Local bypass: `LOCAL_DEV_USER_EMAIL` on `localhost` / `127.0.0.1` only. Missing Access header in production → `401`.

Team settings show the allowlist in a **disabled** textarea so the mock cannot pretend to write secrets.

When Access is configured: Google login at the Access prompt, policy = Atarashi Lab emails, **bypass `/`** (public LP). Details: [deploy-and-access.md](./deploy-and-access.md).

## Field encryption

`server/security/field-crypto.ts`: AES-GCM, 12-byte IV, `base64(iv).base64(ciphertext)`.

- Key: `FIELD_ENCRYPTION_KEY` — 32-byte hex (64 chars), wrangler secret / `.dev.vars` only.
- **Not wired to D1.** No idea table yet. Tests cover round-trip + bad key.
- Do not log plaintext bodies. Do not put the key in `wrangler.jsonc`.

## CI security

`.github/workflows/pr.yml` on every PR:

| Check | Why |
| --- | --- |
| typecheck / lint / test | Catch breaks before merge |
| gitleaks | Stop committed secrets |
| zizmor | GitHub Actions audit |
| pnpm audit | Dependency CVEs (`--audit-level=high`) |
| ASH | Additional static checks |

Also: Dependabot, lefthook (local), security headers middleware (`x-content-type-options`, `x-frame-options`, referrer-policy). Deploy uses a least-privilege API token, not a hardcoded credential.

## Headers / CORS

Same-origin UI. No wide CORS on APIs. Public LP is the only unauthenticated document we intend to ship.
