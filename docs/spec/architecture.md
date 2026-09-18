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

Bindings declared only if used. Today that is **D1 `DB`** and **Workers AI `AI`** (per-idea research and create-time auto-tags). No unused KV, R2, Queue, or Durable Object bindings.

```
Browser
  → Worker (SSR pages + Hono)
      → D1 binding `DB` (idea-cloud-db)
      → Workers AI binding `AI` (idea research v0 + create auto-tags; no web search)
      → secrets from wrangler / `.dev.vars` (never in git)
```

Local: `pnpm dev` (Vite + wrangler). Production: `.github/workflows/deploy.yml` on push to `main` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

## D1

| Item             | Today                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Database name    | `idea-cloud-db`                                                                                                                                              |
| Binding          | `DB`                                                                                                                                                         |
| Migrations       | `todos` (template) + `ideas` (`migrations/`)                                                                                                                 |
| `ideas` columns  | `id`, `title`, `body`, `stage` (default `spark`), `tags` (JSON text `[]`), `created_at`, plus nullable `research_notes` / `research_model` / `researched_at` |
| Members table    | **Not created**                                                                                                                                              |
| Field encryption | Helper exists; **not** applied to idea rows                                                                                                                  |

**作成** is a React Router action (`insert` into `ideas`, optional Workers AI tags). List (`/app/list`) and detail (`/app/ideas/:id`) load via route loaders. List tabs/filters live in `/app/list` search params (`tab`, `view`, `stage`, `tag`, `q`). Per-idea **リサーチ** is a React Router action on the detail page (`env.AI.run`, persist on the idea row). Hono `GET/POST /api/ideas` and `POST /api/ideas/:id/research` follow the template `todos` pattern (still behind Access middleware). Shared workspace — no owner column.

Intended later: idea bodies encrypted with AES-GCM _before_ insert. See [security.md](./security.md). First-deploy steps: [deploy-and-access.md](./deploy-and-access.md).

## Workers AI research (v0)

Summarize / analyze one idea’s stored text. **No web search**, Browser Rendering, embeddings, or merge-AI.

| Item     | Today                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Binding  | `AI` in `wrangler.jsonc`. Local Vite uses `remoteBindings: false` (no AI simulator). Vitest omits `AI` so CI stays local. Tests stub `setTestAiRun` / `setTestTagAiRun`. |
| Gate     | Idea `stage` must be `selected` (採用). Otherwise 409 / 「採用してからリサーチできます」                                                                                 |
| UI       | Idea detail only (`#research`). Not a primary nav tab. `/app/research?from=:id` redirects to the detail section                                                          |
| Persist  | `ideas.research_notes`, `research_model`, `researched_at`                                                                                                                |
| Presets  | `fast` (default) `@cf/meta/llama-3.1-8b-instruct-fp8-fast`; `standard` `@cf/qwen/qwen3-30b-a3b-fp8`; `deep` `@cf/meta/llama-3.3-70b-instruct-fp8-fast`                   |
| Override | Optional `model` query/body, allowlisted to those three IDs only                                                                                                         |

Prompt: Japanese bullets for 観点 / リスク / 次の一手. Tests stub `env.AI.run` via a thin wrapper. Vite `pnpm dev` does not open a remote Workers AI session.

## Workers AI auto-tags

On idea create, if the client sent no tags, run the **fast** research model (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`) on title+body and store 2–5 short Japanese tags on `ideas.tags`. User-supplied tags win. Any AI failure creates the row with `[]`. No extra table or queue.

## Provenance

| Layer                                       | Source                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| Worker, CI, Access middleware, sample todos | squat `personal-fullstack` from `MasatoraAtarashi/app-template`              |
| Product routes, mock data, Japanese UI      | This repo                                                                    |
| Visual tokens                               | Claude Design system frame (Linear IA × LiteLLM-thin chrome × pastel stages) |

`app-template` is a squat monorepo (`isTemplate: false`). Copied out; template repo not modified.

## Storage map (product, mostly future)

| Need                 | Service                                                 |
| -------------------- | ------------------------------------------------------- |
| Ideas (SQL)          | **D1** `ideas` (plaintext, including research v0 notes) |
| Members              | Not created                                             |
| Profile / flags      | Workers KV (not added)                                  |
| Uploads              | R2 (not added)                                          |
| Multiplayer / agents | Durable Objects (not this pass)                         |
| Background jobs      | Queues + DLQ (not this pass)                            |
