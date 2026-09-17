# Architecture (Cloudflare Workers / D1)

Idea Cloud runs as **one Cloudflare Worker**: React Router v7 SSR for the UI and Hono for `/api/*`, same isolate. Relational data is **D1** (SQLite at the edge) via Drizzle.

Product **ideas** persist to D1. Auth is still mock (UI login is a link to `/app`; `/api/*` still has template Access middleware).

## Cloudflare Workers

| Piece         | Path / setting                                   |
| ------------- | ------------------------------------------------ |
| Worker entry  | `workers/app.ts`                                 |
| Config        | `wrangler.jsonc` (not `wrangler.toml`)           |
| Compat        | `"compatibility_flags": ["nodejs_compat"]`       |
| Observability | `observability.enabled`, `head_sampling_rate: 1` |
| Source maps   | `upload_source_maps: true`                       |
| UI routes     | `app/routes.ts` → `app/routes/*`                 |
| API           | `server/api/` (`ideas` + template `todos`)       |
| Auth on APIs  | `server/middleware/access-auth.ts`               |

Bindings declared only if used. Today that is **D1 `DB`**. No unused Workers AI, KV, R2, Queue, or Durable Object bindings.

```
Browser
  → Worker (SSR pages + Hono)
      → D1 binding `DB` (idea-cloud-db)
      → secrets from wrangler / `.dev.vars` (never in git)
```

Local: `pnpm dev` (Vite + wrangler). Production: `.github/workflows/deploy.yml` on push to `main` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

## D1

| Item             | Today                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Database name    | `idea-cloud-db`                                                                         |
| Binding          | `DB`                                                                                    |
| Migrations       | `todos` (template) + `ideas` (`migrations/`)                                            |
| `ideas` columns  | `id`, `title`, `body`, `stage` (default `spark`), `tags` (JSON text `[]`), `created_at` |
| Members table    | **Not created**                                                                         |
| Field encryption | Helper exists; **not** applied to idea rows                                             |

**作成** is a React Router action (`insert` into `ideas`). List (`/app/list`) and detail (`/app/ideas/:id`) load via route loaders. Hono `GET/POST /api/ideas` follows the template `todos` pattern (still behind Access middleware). Shared workspace — no owner column.

Intended later: idea bodies encrypted with AES-GCM _before_ insert. See [security.md](./security.md). First-deploy steps: [deploy-and-access.md](./deploy-and-access.md).

## Provenance

| Layer                                       | Source                                                          |
| ------------------------------------------- | --------------------------------------------------------------- |
| Worker, CI, Access middleware, sample todos | squat `personal-fullstack` from `MasatoraAtarashi/app-template` |
| Product routes, mock data, Japanese UI      | This repo                                                       |
| Visual tokens                               | LiteLLM Admin light chrome + Relic in-app list IA               |

`app-template` is a squat monorepo (`isTemplate: false`). Copied out; template repo not modified.

## Storage map (product, mostly future)

| Need                 | Service                         |
| -------------------- | ------------------------------- |
| Ideas (SQL)          | **D1** `ideas` (plaintext)      |
| Members              | Not created                     |
| Profile / flags      | Workers KV (not added)          |
| Uploads              | R2 (not added)                  |
| Multiplayer / agents | Durable Objects (not this pass) |
| Background jobs      | Queues + DLQ (not this pass)    |
