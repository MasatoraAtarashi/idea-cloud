# Follow-up: replace Access middleware with in-app Google OAuth

**Decision (2026-09-16):** production auth is **in-app Google OAuth**, not Cloudflare Access as the primary gate. Keep the dual layer: Google identity + `ACCESS_ALLOWED_EMAILS`.

This pass does **not** implement real OAuth. `/login` is a visual mock (Sign in with Google button → `/app`). Screenshots and PR #1 stay unblocked.

## Why the template still has Access

`server/middleware/access-auth.ts` came from squat `personal-fullstack`. APIs still require `Cf-Access-Authenticated-User-Email`, or `LOCAL_DEV_USER_EMAIL` on localhost. Until this swap ships, `AUTH_MOCK=1` plus `LOCAL_DEV_USER_EMAIL` is a temporary stand-in on workers.dev when Access is absent. That is leftover scaffolding, not the product model. Tracked on the template as [app-template#28](https://github.com/MasatoraAtarashi/app-template/issues/28).

## Swap plan (after visual sign-off)

Do these in order. Stop if a secret would have to be invented.

1. **Google Cloud OAuth client** (Web application). Authorized redirect URI = production `/api/auth/google/callback` (and localhost for dev). Store `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` with `wrangler secret` / `.dev.vars` only.
2. **Routes:** `GET /api/auth/google` starts the authorization code flow (state + PKCE). `GET /api/auth/google/callback` exchanges the code, reads email from userinfo / ID token.
3. **Allowlist:** after a verified Google email, apply `isEmailAllowed`. Fail closed: unknown email → `403`, do not set a session.
4. **Session:** httpOnly Secure cookie on the Worker (signed). `/app` and `/api` require it. `/login` stays public.
5. **Remove** Access middleware and `Cf-Access-Authenticated-User-Email` checks. Keep `LOCAL_DEV_USER_EMAIL` only as a localhost stand-in until OAuth works locally (or use a real Google test client).
6. **Tests:** login mock HTML; callback rejects missing/invalid code; allowlist 403; session cookie on success. Keep CI (gitleaks/zizmor/audit/ASH).
7. **Do not** put Cloudflare Access in front as the primary login. Optional extra Zero Trust later is a separate decision — not this swap.

## Out of scope here

- Choosing which D1 columns to encrypt
- Workers AI
- Public signup
