# Architecture

Cloudflare Workers app. Personal-fullstack shape: SSR UI + Hono API on one Worker, D1 for SQL.

## Provenance

| Layer | Source |
| --- | --- |
| Runtime / CI / Access middleware / sample todos | squat `personal-fullstack` from `MasatoraAtarashi/app-template` |
| Product routes, mock data, Japanese UI copy | This repo |
| Visual tokens | LiteLLM dashboard **default light** (`globals.css`), not the template todo UI |

`app-template` is a squat monorepo (`isTemplate: false` on GitHub). This app was copied out; the template repo was not modified.

## Runtime

```
Browser
  → Worker (React Router v7 SSR + Hono)
      → D1 (`DB`) — sample `todos` only today
      → secrets via wrangler / `.dev.vars` (never committed)
```

- **Entry:** `workers/app.ts`
- **UI:** `app/` (React Router routes in `app/routes.ts`)
- **API:** `server/api/` (template `/api/todos` still mounted)
- **Auth middleware:** `server/middleware/access-auth.ts` on API routes
- **Config:** `wrangler.jsonc` (not toml)

Bindings actually used: **D1 `DB`**. No unused AI / KV / R2 / Queue bindings.

## Storage choice (intended, not all wired)

| Need | Service |
| --- | --- |
| Idea records, members (relational) | D1 |
| Settings / allowlist-as-config if we stop using env | Workers KV (not added yet) |
| Uploads / AI assets | R2 (not added yet) |
| Agent / realtime | Durable Objects (not this pass) |
| Background jobs | Queues + DLQ (not this pass) |

Field bodies should be encrypted at rest with AES-GCM before they hit D1. Helper exists; idea schema does not. See [security.md](./security.md).

## Local vs production auth

- Production: Cloudflare Access injects `Cf-Access-Authenticated-User-Email`.
- Local: `LOCAL_DEV_USER_EMAIL` on localhost / 127.0.0.1 only.
- Optional extra gate: `ACCESS_ALLOWED_EMAILS` (empty = defer to Access policy).

## Observability

`wrangler.jsonc`: `observability.enabled`, `head_sampling_rate: 1`, `upload_source_maps: true`, `compatibility_flags: ["nodejs_compat"]`.
