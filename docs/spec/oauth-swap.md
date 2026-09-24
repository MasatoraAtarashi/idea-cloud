# Auth: in-app Google OAuth

**Decision (2026-09-16):** production auth is **in-app Google OAuth**, not Cloudflare Access.
**Implemented (2026-09-24):** the login mock is gone. `/login` starts a real authorization code flow on the Worker, and the template `Cf-Access-Authenticated-User-Email` middleware has been deleted.

Two credentials reach `/api/*`, both resolved in `server/auth/principal.ts`:

| Client              | Credential                              | Notes                                                      |
| ------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Browser             | `ic_session` cookie (httpOnly, signed)  | Set by the OAuth callback                                  |
| Native app, scripts | `Authorization: Bearer <APP_API_TOKEN>` | Single-operator token; attributed to `APP_API_TOKEN_EMAIL` |

`/mcp` keeps its own shared bearer (`MCP_API_KEY`) and accepts neither of the above.

## Flow

```
/login  →  GET /api/auth/google          state + PKCE in a 10-minute httpOnly cookie
        →  accounts.google.com           scope "openid email", prompt=select_account
        →  GET /api/auth/google/callback code exchange with the client secret
                                         → id_token: aud / iss / email_verified checked
                                         → isEmailAllowed(email) or 403 (no session)
                                         → ic_session cookie, redirect to ?next=
POST /api/auth/logout                    clears the cookie
```

- The code is exchanged server-side over TLS with `GOOGLE_CLIENT_SECRET`, so the `id_token` needs no JWKS signature check. `aud`, `iss`, and `email_verified` are still verified (`server/auth/google-oauth.ts`).
- `?next=` is accepted only as a same-site absolute path (`app/lib/next-path.ts`), so it cannot become an open redirect.
- Failures redirect to `/login?error=<code>` and render Japanese copy from `app/auth/google-login.ts`. No session is set on any failure path.

## Session cookie

`server/auth/session.ts`. `ic_session` = base64url JSON payload + HMAC-SHA256, `httpOnly`, `SameSite=Lax` (the OAuth redirect must carry it), `Secure` off localhost only, 14 days.

Self-contained on purpose: there is no `users` or `sessions` table. The trade-off is that **a single cookie cannot be revoked individually** — rotate `SESSION_SECRET` to invalidate every session at once. That is acceptable while the workspace is one or two people; per-device sign-out needs a `sessions` table and is not built.

`SESSION_SECRET` is required in production. On `localhost` / `127.0.0.1` a fixed dev key is used when it is unset, so `pnpm dev` and Playwright work without secrets. It never falls back on a real hostname.

## Gates

| Path           | Gate                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`,`/login`   | Public. A signed-in visitor is redirected into `/app`.                                                                                                |
| `/app/**`      | `server/auth/page-gate.ts` in `workers/app.ts` → `/login?next=<path>` when signed out. The session email is passed to loaders as `context.userEmail`. |
| `/api/**`      | `server/middleware/session-auth.ts` → `401` (no credential) / `403` (not allowed).                                                                    |
| `/api/auth/**` | Public — mounted before the `/api` gate.                                                                                                              |
| `/mcp`         | `MCP_API_KEY` bearer.                                                                                                                                 |

The allowlist is re-read from env on **every** request, so removing an email takes effect before an issued cookie expires.

## Secrets

| Name                    | Where                                                |
| ----------------------- | ---------------------------------------------------- |
| `GOOGLE_CLIENT_ID`      | Google Cloud → OAuth client (Web application)        |
| `GOOGLE_CLIENT_SECRET`  | same client; `wrangler secret` / `.dev.vars` only    |
| `SESSION_SECRET`        | `openssl rand -hex 32`                               |
| `ACCESS_ALLOWED_EMAILS` | Comma-separated. Empty = any verified Google account |
| `APP_API_TOKEN`         | Optional. Native app / scripts                       |
| `APP_API_TOKEN_EMAIL`   | Optional. Defaults to a single-entry allowlist       |

Authorized redirect URIs on the Google client: `https://<production host>/api/auth/google/callback`, plus `http://localhost:5173/api/auth/google/callback` for local work. Do not invent credential values.

## Local and e2e

With `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` unset, `GET /api/auth/google` on localhost signs `LOCAL_DEV_USER_EMAIL` in directly (still allowlist-checked) and sets the same cookie. Playwright's `setup` project (`e2e/auth.setup.ts`) does this once and reuses the storage state. This branch is unreachable on a non-localhost hostname.

## Mobile (planned, not built)

The Flutter app uses `APP_API_TOKEN` as `Authorization: Bearer`, stored in the Keychain / Keystore. Once a Google Workspace domain exists, replace it with on-device Google Sign-In: the app sends a fresh `id_token`, the Worker verifies it against Google's JWKS (`iss` / `aud` / `exp` / `nonce` / `hd`) and issues a short-lived app token. That keeps membership in Google Admin and still needs no user table. Cloudflare Access cannot be the primary gate in either case — a native client has no Access session.

## Not built

- `users` / `sessions` tables, roles, per-device sign-out, invite links
- Workspace domain (`hd`) restriction — no domain yet
- Refresh-token rotation (nothing issues a refresh token)
- Field-level encryption of D1 columns
- Public signup
