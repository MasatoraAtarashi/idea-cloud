# Architecture (Cloudflare Workers / D1)

Idea Cloud runs as **one Cloudflare Worker**: React Router v7 SSR for the UI and Hono for `/api/*`, same isolate. Relational data is **D1** (SQLite at the edge) via Drizzle.

This pass ships the Worker + D1 *shape*. Product idea rows are not created yet.

## Cloudflare Workers

| Piece | Path / setting |
| --- | --- |
| Worker entry | `workers/app.ts` |
| Config | `wrangler.jsonc` (not `wrangler.toml`) |
| Compat | `"compatibility_flags": ["nodejs_compat"]` |
| Observability | `observability.enabled`, `head_sampling_rate: 1` |
| Source maps | `upload_source_maps: true` |
| UI routes | `app/routes.ts` → `app/routes/*` |
| API | `server/api/` (template `todos` still mounted) |
| Auth on APIs | `server/middleware/access-auth.ts` |

Bindings declared only if used. Today that is **D1 `DB`**. No unused Workers AI, KV, R2, Queue, or Durable Object bindings.

```
Browser
  → Worker (SSR pages + Hono)
      → D1 binding `DB` (idea-cloud-db)
      → secrets from wrangler / `.dev.vars` (never in git)
```

Local: `pnpm dev` (Vite + wrangler). Production: `.github/workflows/deploy.yml` on push to `main` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

## D1

| Item | Today |
| --- | --- |
| Database name | `idea-cloud-db` |
| Binding | `DB` |
| `database_id` | Placeholder `00000000-0000-0000-0000-000000000000` until `wrangler d1 create` |
| Migrations | Template `todos` table only (`migrations/`) |
| Idea / member tables | **Not created** |
| Field encryption | Helper exists; not applied to D1 rows |

Intended later: idea bodies and similar sensitive columns encrypted with AES-GCM *before* insert. See [security.md](./security.md). First-deploy steps: [deploy-and-access.md](./deploy-and-access.md).

## Provenance

| Layer | Source |
| --- | --- |
| Worker, CI, Access middleware, sample todos | squat `personal-fullstack` from `MasatoraAtarashi/app-template` |
| Product routes, mock data, Japanese UI | This repo |
| Visual tokens | LiteLLM dashboard **default light**, not the template todo UI |

`app-template` is a squat monorepo (`isTemplate: false`). Copied out; template repo not modified.

## Storage map (product, mostly future)

| Need | Service |
| --- | --- |
| Ideas, members (SQL) | **D1** |
| Profile / flags | Workers KV (not added) |
| Uploads | R2 (not added) |
| Multiplayer / agents | Durable Objects (not this pass) |
| Background jobs | Queues + DLQ (not this pass) |
