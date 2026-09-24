# Architecture (Cloudflare Workers / D1)

Idea Cloud runs as **one Cloudflare Worker**: React Router v7 SSR for the UI and Hono for `/api/*`, same isolate. Relational data is **D1** (SQLite at the edge) via Drizzle.

Product **ideas** persist to D1. Auth is in-app Google OAuth: `/login` → `/api/auth/google` → callback sets a signed httpOnly session cookie; `/app/**` and `/api/*` require it (`server/auth/`, [oauth-swap.md](./oauth-swap.md)).

## Cloudflare Workers

| Piece         | Path / setting                                    |
| ------------- | ------------------------------------------------- |
| Worker entry  | `workers/app.ts`                                  |
| Config        | `wrangler.jsonc` (not `wrangler.toml`)            |
| Compat        | `"compatibility_flags": ["nodejs_compat"]`        |
| Observability | `observability.enabled`, `head_sampling_rate: 1`  |
| Source maps   | `upload_source_maps: true`                        |
| UI routes     | `app/routes.ts` → `app/routes/*`                  |
| API           | `server/api/` (`ideas` + template `todos`)        |
| Auth on APIs  | `server/middleware/access-auth.ts`                |
| Remote MCP    | `POST /mcp` (`server/mcp/`), bearer `MCP_API_KEY` |

Bindings declared only if used. Today that is **D1 `DB`** and **Workers AI `AI`** (per-idea research, brainstorm, discuss, evaluation fallback, and auto-tag fallback). TypeSafe Jev is an outbound HTTPS call when `TYPESAFE_API_KEY` is set. Research also does outbound HTML/JSON search (DuckDuckGo / Bing, or Brave when `SEARCH_API_KEY` is set). No unused KV, R2, Queue, Browser Rendering, or Durable Object bindings.

Remote MCP is the same Worker: stateless Streamable HTTP at `/mcp` (`server/mcp/`, `createMcpHandler` from `@modelcontextprotocol/server`). Tools call the existing Drizzle helpers and D1. Auth is `Authorization: Bearer` with `MCP_API_KEY` (or `MCP_TOKEN` when that is unset), not the browser session cookie. See [mcp.md](./mcp.md).

```
Browser
  → Worker (SSR pages + Hono)
      → D1 binding `DB` (idea-cloud-db)
      → Workers AI binding `AI` (research + brainstorm + discuss; evaluation + auto-tags when Jev is unset)
      → TypeSafe System One (`POST https://api.typesafe.ai/v1/systemone`) when `TYPESAFE_API_KEY` is set
      → Web search (DuckDuckGo HTML / Bing HTML / DuckDuckGo Instant Answer; Brave Search API when `SEARCH_API_KEY` is set)
      → secrets from wrangler / `.dev.vars` (never in git)

MCP client
  → POST /mcp (Bearer MCP_API_KEY)
      → same D1 binding `DB`
```

Local: `pnpm dev` (Vite + wrangler). Playwright e2e (`pnpm test:e2e`) talks to that server and local D1; a `setup` project signs in through the localhost dev path once and shares the session. See [e2e.md](./e2e.md). Production: `.github/workflows/deploy.yml` on push to `main` or `workflow_dispatch` on `main` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). Worker script name: `idea-cloud`.

## D1

| Item                 | Today                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database name        | `idea-cloud-db`                                                                                                                                                                                                                                                                                                                                                                  |
| Binding              | `DB`                                                                                                                                                                                                                                                                                                                                                                             |
| `database_id`        | `c49e0fd3-b7e4-422e-b3fc-019bf0264dab` (live, APAC). Vitest keeps a dummy id in `wrangler.vitest.jsonc`.                                                                                                                                                                                                                                                                         |
| Migrations           | `todos` (template) + `ideas` + `idea_comments` + `idea_brainstorms` + `idea_chat_messages` + `saved_views` + `inspirations` + `categories` (+ OGP columns in `0007_inspiration_ogp.sql`, `research_sources` in `0008_research_sources.sql`, chat in `0009_idea_chat_messages.sql`, categories in `0010_categories.sql`)                                                          |
| `ideas` columns      | `id`, `title`, `body`, `stage` (default `spark`), `tags` (JSON text `[]`), nullable `category_id`, `created_at`, `updated_at`, research fields (`research_notes` / `research_model` / `researched_at` / `research_sources` JSON), evaluation fields, review (`last_reviewed_at` / `review_status`), reflection (`reflection_outcome` / `reflection_status` / `reflection_notes`) |
| `categories`         | `id`, unique `name`, `sort_order`, `created_at`. Seeded 執筆アイデア / 事業アイデア / 組織改善. One optional bucket per idea, not a tag.                                                                                                                                                                                                                                         |
| `idea_comments`      | `id`, `idea_id`, `body`, `author_id`, `author_name`, `created_at`. Chronological scrap-style notes. No threads.                                                                                                                                                                                                                                                                  |
| `idea_brainstorms`   | `id`, `idea_id`, `notes`, `model`, `created_at`. All rows appear in idea-detail **履歴**; research/evaluation remain latest-only columns on `ideas`.                                                                                                                                                                                                                             |
| `idea_chat_messages` | `id`, `idea_id`, `role` (`user` or `assistant`), `body`, nullable `model`, `created_at`. Chronological per-idea discuss thread (**相談**).                                                                                                                                                                                                                                       |
| `saved_views`        | `id`, `name`, `filters` (JSON including `minDays` and optional `categoryId`), `created_at`. Named list filters.                                                                                                                                                                                                                                                                  |
| `inspirations`       | `id`, `title`, `url` (nullable), `memo`, `tags` (JSON text `[]`), `created_at`, `updated_at`, Open Graph cache (`og_title` / `og_description` / `og_image_url` / `og_site_name` / `og_fetched_at` / `og_status`). URL/memo shelf; OGP image is hotlinked, no R2.                                                                                                                 |
| Members table        | **Not created**                                                                                                                                                                                                                                                                                                                                                                  |
| Field encryption     | Helper exists; **not** applied to idea rows                                                                                                                                                                                                                                                                                                                                      |

**作成** is a React Router action (`insert` into `ideas`, optional auto-tags via Jev or Workers AI, then AI評価 via `waitUntil` so the redirect is not held for the model; archive skips evaluation; eval failure does not fail create). After insert (and after an edit that changes `body`), distinct http(s) URLs in the idea text are upserted into `inspirations` (max 5, no page fetch at save time; failures are ignored). List (`/app/list`) and detail (`/app/ideas/:id`) load via route loaders. List tabs/filters live in `/app/list` search params (`tab`, `view`, `stage`, `tag`, `category`, `q`, `days`, `sort`, `dir`, `v`). Named views persist in `saved_views` (sort is URL-only, not part of a saved view). Per-idea **コメント** / **編集** / **human-score** / **見直し** / **振り返り** / **リサーチ** / **ブレスト** / **AI評価** / **相談** / **削除** are React Router actions on the detail page; AI intents return `{ ok: true }` so `useFetcher` can revalidate in place instead of waiting on a document navigation. **削除** hard-deletes the idea after removing `idea_comments`, `idea_brainstorms`, and `idea_chat_messages`. Detail tabs (`buildIdeaHistory` on **AI/履歴**) concatenate the idea’s latest research/evaluation snapshot with every `idea_brainstorms` row (newest first). `/app/analytics` and `/app/inspirations` are first-class nav destinations (desktop sidebar + mobile tabs; compose is a header +). `/app/inspirations` is a gallery CRUD for the memo shelf; create/update refetch OGP when the URL changes (`POST /api/inspirations/:id/ogp` to refresh). **AIブレスト** inserts an idea then reuses `brainstormIdea`. Hono `GET/POST /api/ideas`, `PATCH/DELETE /api/ideas/:id`, `GET/POST /api/ideas/:id/comments`, `POST /api/ideas/:id/research`, `GET/POST /api/ideas/:id/brainstorm(s)`, `POST /api/ideas/:id/evaluate`, `GET /api/ideas/:id/discussions`, `POST /api/ideas/:id/discuss`, `GET/POST/PATCH /api/inspirations`, `POST /api/inspirations/:id/ogp`, `POST /api/inspirations/:id/brainstorm`, and `GET/POST/DELETE /api/saved-views` follow the template `todos` pattern (behind the session / app-token gate). Shared workspace — no owner column.

Intended later: idea bodies encrypted with AES-GCM _before_ insert. See [security.md](./security.md). First-deploy steps: [deploy-and-access.md](./deploy-and-access.md).

## Inspiration Open Graph (v1)

Outbound HTML fetch on inspiration create/update when the URL changes, plus `POST /api/inspirations/:id/ogp` / detail **再取得**. Parser reads `og:title`, `og:description`, `og:image` (and `og:image:url` / `og:image:secure_url`), `og:site_name`, with `twitter:image` / `<title>` fallbacks. Persist on the row. Worker-safe: 5s timeout, 512KB HTML cap, 3 redirects, public http(s) only (SSRF reject for private IPs / localhost / credentials). `og:image` stored only when public https. Failure is fail-soft (`og_status=failed`). Images are hotlinked in the gallery; no R2 and no image proxy. Gallery and API create do not require a title: a URL alone is enough. Pasted URLs are trimmed (whitespace, newlines, zero-width characters); `http` and `https` are accepted; a bare host/path is stored with `https://`. The form control is not `type=url`. An empty title becomes the fetched page title when Open Graph succeeds, otherwise a path slug or hostname (「無題」 only when nothing else is available). A typed title is kept, and a failed fetch still saves the row. Idea-body URL upsert does **not** fetch HTML at save time (compose stays fail-soft and fast); those rows show the gallery glyph fallback until **再取得** or a gallery/API URL save. Tests cover HTML parse + URL reject (`test/ogp.test.ts`).

## Workers AI research (v1)

Summarize / analyze one idea’s stored text **and** a small set of live web results. No Browser Rendering, embeddings, or merge-AI. Cloudflare AI Search is for indexed own-content, so this path uses the same Worker HTML fetch style as OGP: DuckDuckGo Lite, DuckDuckGo HTML, Bing HTML, then DuckDuckGo Instant Answer JSON. Optional Brave Search API when `SEARCH_API_KEY` is set. Misses are structured logs and do not include the key.

| Item     | Today                                                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binding  | `AI` in `wrangler.jsonc`. Local Vite uses `remoteBindings: false` (no AI simulator). Vitest omits `AI` so CI stays local. Tests stub `setTestAiRun` / `setTestTagAiRun` / `setTestSystemOneRun` / `setTestWebSearch`.                                                   |
| Gate     | Idea `stage` must not be `archived`. Otherwise 409 / 「アーカイブではリサーチできません」. 着想 / 熟成中 / 熟した / 採用 are allowed.                                                                                                                                   |
| UI       | Idea detail **リサーチ** tab + list row menu POST `intent=research` (above 段階). Locked copy only for archive. `#research` shows **先行事例** (outbound links) above **AIコメント**. **AI/履歴** repeats the latest snapshot. `/app/research?from=:id` redirects there |
| Persist  | `ideas.research_notes`, `research_model`, `researched_at`, `research_sources` (JSON `{ status, query, results: [{ title, url, snippet }] }`)                                                                                                                            |
| Search   | Fail-soft. Empty/blocked search still saves notes and stores `status: failed` so the UI can show **Web検索未取得**. Never invent URLs.                                                                                                                                  |
| Presets  | `fast` (default) `@cf/meta/llama-3.1-8b-instruct-fp8-fast`; `standard` `@cf/qwen/qwen3-30b-a3b-fp8`; `deep` `@cf/meta/llama-3.3-70b-instruct-fp8-fast`                                                                                                                  |
| Override | Optional `model` query/body, allowlisted to those three IDs only                                                                                                                                                                                                        |

Prompt: Japanese bullets for 観点 / リスク / 次の一手, with the fetched titles/URLs as the only allowed citations. Tests stub `env.AI.run` via a thin wrapper. Vite `pnpm dev` does not open a remote Workers AI session.

## Workers AI brainstorm (v1)

Expand an idea into concrete angles / variants / next questions / related directions. Same Workers AI binding and model allowlist as research. Default preset is **standard**. Persist in `idea_brainstorms`; detail **履歴** lists every row (newest first). Archive 409 / 「アーカイブではブレストできません」. Fail-soft Japanese 502. UI: detail rail **ブレスト** + list menu + mobile detail swipe → AI panel, `#brainstorm`.

## TypeSafe Jev (System One)

When `TYPESAFE_API_KEY` is set (`.dev.vars` locally, `wrangler secret put` in production), the Worker POSTs to `https://api.typesafe.ai/v1/systemone` with model `jev-latest`. The `@typesafe-ai/sdk` is **not** used: it may assume Node `process.env`, so a thin `fetch` client in `server/ai/typesafe.ts` takes the key from `env.TYPESAFE_API_KEY` explicitly. The key is never logged.

| Path                       | Jev                                                                                                                                                              | Fallback                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Create auto-tags           | One `choice` over a curated Japanese tag set; 2–5 tags from the probability distribution                                                                         | Workers AI fast 8B, then `[]`         |
| AI評価                     | Score axes (novelty / impact / feasibility / clarity / risk) + `noul` (pursue) + `choice` (next action), combined in code to a 1–5 `ai_score` and Japanese notes | Existing Workers AI evaluation prompt |
| リサーチ / ブレスト / 相談 | リサーチ adds fail-soft web results as 先行事例. Brainstorm and per-idea discuss stay on Workers AI prose. Discuss does not call Jev.                            | Workers AI (要約・考察・会話)         |

User-supplied tags still win. Archive still 409. Persist evaluation on the same idea columns (`ai_score`, `ai_evaluation`, `ai_evaluated_at`, `ai_evaluation_model` = `jev-latest`). List chips and detail **AI評価** already render those fields.

## Workers AI evaluation (fallback)

Same binding and allowlist. Default preset **standard**. Prompt: Japanese 強み / リスク / 新規性 / 次の一手 (plain bullets, no axis decimals) plus a final `スコア: N` (1–5). Persist on the idea row. Archive 409 / 「アーカイブではAI評価できません」. Fail-soft Japanese 502. Create schedules the same path in the background. Tests stub `setTestAiRun`. UI: **AI評価** as **推し度** plus section cards (pre-wrap fallback), compact list chips. Jev notes use the same headings with qualitative 進める価値 (低め / ふつう / 高め) so `スコア: N` still parses.

## Workers AI discuss (v1)

Freeform chat about one idea. Same Workers AI binding and model allowlist. Default preset **standard**. Not Jev. Context is title, body, stage, tags, a shortened latest evaluation, and a few recent comments (truncated). Do not invent citations. Legal-risk replies include a short disclaimer that this is not legal advice. Persist every turn in `idea_chat_messages`. Archive 409 / 「アーカイブでは相談できません」. Fail-soft Japanese 502; the user turn is kept. UI: detail tab **相談** (`#discuss`), heading **AIと話す**, starter chips, `useFetcher` + `useInstantPending`. List ⋯ and the detail AI surfaces link to the tab. Tests stub `setTestAiRun`. MCP has no discuss tool ([mcp.md](./mcp.md)).

## Diagnostic logs

`server/diag.ts` (`logDiag`) and a few direct `logger` calls emit one JSON line per event (`timestamp`, `level`, `msg`, plus short fields). Callers must not log secrets, prompts, idea bodies, full URLs, or `Authorization`. Booleans such as `hasTypesafeApiKey` and `hasSearchApiKey` are allowed. Failures use an error class (`timeout`, `missing_binding`, `http`, `parse`, …) and sometimes an HTTP status — not the response body.

Covered paths: create prerequisites; auto-tag and create-time auto-evaluate (`scheduled` / `skipped` when archived / `success` / `fail`); TypeSafe calls; Workers AI research, brainstorm, discuss, and evaluation; web-search provider misses (provider name, status or timeout, result count) and a failed search reason (`no_search_api_key` or `all_providers_missed`, also stored on the sources JSON); OGP fetch failures (hostname and error class); MCP auth failures (`missing_key` / `missing_bearer` / `mismatch`). Search still fail-softs to **Web検索未取得**. Brave runs only when `SEARCH_API_KEY` is set; otherwise DuckDuckGo Lite, DuckDuckGo HTML, Bing HTML, then Instant Answer.

## Workers AI auto-tags (fallback)

On idea create, if the client sent no tags and Jev is unset or failed, run the **fast** research model (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`) on title+body and store 2–5 short Japanese tags on `ideas.tags`. User-supplied tags win. Any AI failure creates the row with `[]`. Compose and list/detail show an empty state so fail-soft does not look like a missing feature. No extra table or queue.

## Responsiveness / paint (INP, LCP, CLS)

No Lighthouse CI in this environment (Chrome DevTools MCP is not attached). Easy wins applied:

| Signal        | Change                                                                                                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INP / tap lag | `useFetcher` for research / brainstorm / evaluate / discuss / comment / edit / score / stage; `{ ok: true }` instead of waiting on a document redirect while Workers AI runs; `useInstantPending` disables + spinner on the click tick |
| LCP           | Google Fonts stylesheet is preload + `media=print` then swap to `all` (not render-blocking); `display=swap` already in the font URL                                                                                                    |
| CLS / tap     | `touch-action: manipulation`; mobile primary controls `min-h-11` (~44px); favicon `sizes` declared; titles wrap instead of single-line clamp                                                                                           |
| Unused work   | List links `prefetch="intent"`; AI work stays behind POST, never in the loader                                                                                                                                                         |

## Idea comments

D1 `idea_comments` (FK to `ideas`). Both the UI composer (`intent=comment`, `context.userEmail`) and the API (`c.get("userEmail")`) attribute the comment to the signed-in email, falling back to `SESSION_USER` only when there is none. Insert bumps `ideas.updated_at`. Max 2000 characters. Oldest-first on detail.

## Saved list views

D1 `saved_views`. Filter JSON matches list URL state (`tab`, `view`, `query`, `stages`, `tags`, `minDays`). List chrome posts `intent=save-view` / `delete-view`. `?v=` expands a named view into the other params (loader redirect when only `v` is present). Max 50 views, name ≤ 40 characters.

## Provenance

| Layer                                  | Source                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Worker, CI, sample todos               | squat `personal-fullstack` from `MasatoraAtarashi/app-template`              |
| Product routes, mock data, Japanese UI | This repo                                                                    |
| Visual tokens                          | Claude Design system frame (Linear IA × LiteLLM-thin chrome × pastel stages) |

`app-template` is a squat monorepo (`isTemplate: false`). Copied out; template repo not modified.

## Storage map (product, mostly future)

| Need                 | Service                                                              |
| -------------------- | -------------------------------------------------------------------- |
| Ideas (SQL)          | **D1** `ideas` (plaintext, including research notes + 先行事例 JSON) |
| Members              | Not created                                                          |
| Profile / flags      | Workers KV (not added)                                               |
| Uploads              | R2 (not added)                                                       |
| Multiplayer / agents | Durable Objects (not this pass)                                      |
| Background jobs      | Queues + DLQ (not this pass)                                         |
