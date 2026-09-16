# Security posture

Closed team. Least privilege. No secrets in git.

## Two different auth layers (do not collapse these)

| Layer | What it is | When |
| --- | --- | --- |
| **Cloudflare Access (Zero Trust)** | Edge gate. Google IdP in Access, not app code. Header: `Cf-Access-Authenticated-User-Email`. | **Now** — early gate for `/app` and APIs |
| **In-app Google OAuth** | Product auth inside the Worker (sessions, in-app identity). | **Later** — not this pass |

The login screen and team settings copy must keep this distinction. Access is not a stub for OAuth; OAuth is a later product feature.

## Allowlist

`ACCESS_ALLOWED_EMAILS` — comma-separated emails, compared lowercase.

- Empty: Access policy is the only filter.
- Set: Access *plus* app 403 if the header email is missing from the list.
- Enforced in `server/middleware/access-auth.ts` via `server/security/allowlist.ts`.
- Team UI textarea is **disabled** so nobody thinks the mock writes the secret.

## Local bypass

`.dev.vars` `LOCAL_DEV_USER_EMAIL` works only for `localhost` / `127.0.0.1`. Production without the Access header is 401.

## Field encryption (stub)

`server/security/field-crypto.ts`: AES-GCM, 12-byte IV, payload `base64(iv).base64(ciphertext)`.

- Key: `FIELD_ENCRYPTION_KEY` — 32-byte hex (64 chars). Wrangler secret / `.dev.vars` only.
- Not wired to D1. No idea table yet.
- Do not log plaintext bodies.

## Headers / CORS

`server/middleware/security-headers.ts` from the template. Public LP is same origin. No wide CORS for APIs.

## CI / secrets scanning

PR workflow: typecheck, lint, test, gitleaks, zizmor, pnpm audit, ASH. Do not commit `.dev.vars`. Do not put tokens in `wrangler.jsonc`.

## Access application shape (when deploying)

See [deploy-and-access.md](./deploy-and-access.md):

- Protect `/app*` and `/api*`.
- **Bypass** `/` (and static assets needed for the LP) so the marketing page stays public.
- IdP: Google. Policy: emails of Atarashi Lab only.
