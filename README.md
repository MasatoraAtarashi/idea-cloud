# Idea Cloud

Team workspace for capturing ideas, leaving them alone, and reviewing them after they have matured. Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学). Japanese product name: アイデアクラウド.

## Language

- **Documentation** (this README, `docs/spec/`, design notes): English.
- **Product UI copy**: Japanese.

Quiet login gate plus a working create/list/detail loop. Ideas persist to D1. Login is still a Google-looking **mock** (no OAuth). No landing page. No dummy seed data.

## Specs

| Doc                                                                    | What it covers                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| [docs/spec/product-requirements.md](docs/spec/product-requirements.md) | Product goals, stages, out of scope                           |
| [docs/spec/architecture.md](docs/spec/architecture.md)                 | Stack, bindings, what came from the template                  |
| [docs/spec/ui-ia.md](docs/spec/ui-ia.md)                               | Screens, IA, visual language                                  |
| [docs/spec/e2e.md](docs/spec/e2e.md)                                   | Playwright against local D1 (mocked auth)                     |
| [docs/spec/security.md](docs/spec/security.md)                         | In-app Google OAuth + allowlist, field crypto                 |
| [docs/spec/deploy-and-access.md](docs/spec/deploy-and-access.md)       | First deploy, live D1 id, Access deferred until URL           |
| [docs/spec/oauth-swap.md](docs/spec/oauth-swap.md)                     | Follow-up: replace Access middleware with real Google OAuth   |
| [docs/spec/mcp.md](docs/spec/mcp.md)                                   | Remote MCP for agents (`/mcp`, bearer token, nine data tools) |

UI previews (desktop ~1280px / mobile ~390px): [docs/ui-previews/](docs/ui-previews/).

## Run locally

```bash
pnpm install
cp .dev.vars.example .dev.vars   # set LOCAL_DEV_USER_EMAIL to your address
pnpm db:migrate:local            # D1 `todos` + `ideas` + comments / brainstorms / chat / saved views / inspirations / research_sources
pnpm dev
```

http://localhost:5173/app is new-idea compose on a phone (viewport or mobile UA). Desktop `/app` replaces to `/app/list`. Idea bodies with http(s) URLs also land on the inspiration shelf.

Playwright (mocked auth, local D1): `pnpm test:e2e`. See [docs/spec/e2e.md](docs/spec/e2e.md).

| Path                | Screen (Japanese UI)                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/app`              | Mobile home: 新規アイデア. Desktop → `/app/list`                                                                                                                |
| `/app/capture`      | Compose alias (desktop opens the list modal)                                                                                                                    |
| `/app/list`         | Idea list (desktop home; mobile 一覧). Views: `?tab=aging`, `?tab=candidates`, `?tab=tried`, `?view=board`, `?stage=`, `?tag=`, `?q=`, `?v=`, `?sort=`, `?dir=` |
| `/app/ideas/:id`    | Idea detail + AI 作業台 (相談 / 評価 / リサーチ / ブレスト); 融合 in ⋯                                                                                          |
| `/app/inspirations` | Inspiration gallery (URL / memo + OGP preview). First-class nav (mobile インスピ tab). Header **+** adds a card. Detail can kick **AIブレスト** into a new idea |
| `/app/analytics`    | Light counts from D1 idea rows (stage + created per day). First-class nav (mobile 分析 tab)                                                                     |
| `/app/merge`        | Merge deep link (not in primary nav)                                                                                                                            |
| `/app/research`     | Research deep link (redirects `from` to idea detail)                                                                                                            |
| `/app/settings`     | Settings (team / access)                                                                                                                                        |
| `/app/team`         | Redirects to settings                                                                                                                                           |

## What was copied from the template

`MasatoraAtarashi/app-template` is not a GitHub Template Repository, so `gh repo create --template` was not used. This app was copied from squat’s **`personal-fullstack`** template (strict tier, Cloudflare Access auth).

**Visual language (honest):** the _stack_ is from the template. In-app chrome is a quiet light console (Linear-leaning IA, white surfaces, pastel stage pills, original cloud mark). Relic’s logo and blue marketing LP are not used.

Included:

- React Router v7 (SSR) + Tailwind CSS 4 + Hono on Cloudflare Workers
- D1 + Drizzle (`ideas` for the product UI; sample `todos` API kept)
- Cloudflare Access middleware (`Cf-Access-Authenticated-User-Email`) — leftover; product auth is in-app Google OAuth
- CI: typecheck / lint / test + Playwright e2e + gitleaks / zizmor / pnpm audit / ASH (`.github/workflows/pr.yml`)
- lefthook, Dependabot, observability on by default

## Stubs / not wired

- **Login:** `/login` looks like Sign in with Google and currently navigates to `/app` (mock). `/app` is new-idea compose; desktop replaces to `/app/list`. Real OAuth is [docs/spec/oauth-swap.md](docs/spec/oauth-swap.md).
- **Allowlist:** `ACCESS_ALLOWED_EMAILS` (comma-separated). Second layer after Google identity. Settings shows a stub, not a working Access editor.
- **Ideas:** D1 `ideas` table. **作成** inserts a row; `/app/list` and `/app/ideas/:id` load from D1. Shared workspace; no owner column; no field encryption. Detail **コメント** persist in `idea_comments` (mock author). List rows show tags, stage, updated, aging, comment count, and research. Named **ビュー** persist in `saved_views`.
- **Field encryption:** AES-GCM helper in `server/security/field-crypto.ts`. Not applied to idea rows.
- **Workers AI / Jev:** per-idea research, brainstorm, and **相談** (AIと話す) on `/app/ideas/:id` from **着想** onward stay on Workers AI. Discuss is not a Jev path and is not an MCP tool. **リサーチ** also fetches a few public web results for **先行事例** (DuckDuckGo Lite / HTML, Bing, Instant Answer; Brave Search when `SEARCH_API_KEY` is set). Search failure is fail-soft (**Web検索未取得**) and still saves model notes; misses are structured logs and do not include the API key. **作成** auto-tags and, in the background, **AI評価** prefer TypeSafe Jev (`jev-latest`) when `TYPESAFE_API_KEY` is set, else the Workers AI fast/standard models. Evaluation failure does not fail create. Archive stays blocked. Failures still create the idea and show **自動タグなし**. Binding `AI` in `wrangler.jsonc`. Relation / evolution still copy-only.
- Sample `/api/todos` remains for template verification. `/api/ideas` mirrors that CRUD style (Access middleware still on `/api`).

Env template: `.dev.vars.example`. Do not commit secret values. Production: `wrangler secret put`.

## Known template gaps

- `app-template` is a squat CLI + multi-template monorepo, not a single app
- GitHub **template flag is false** (as of 2026-09)
- Team purpose (`team-admin`) is coming soon; `personal-fullstack` is the closest ready template
- Auth in code today is still the template **Cloudflare Access** middleware. Production model is **in-app Google OAuth** + allowlist ([app-template#28](https://github.com/MasatoraAtarashi/app-template/issues/28))
- Cloudflare GitHub OIDC for wrangler deploy is not available; deploy CI uses `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
- Production `wrangler.jsonc` uses live D1 `idea-cloud-db` (`c49e0fd3-b7e4-422e-b3fc-019bf0264dab`). `wrangler.vitest.jsonc` keeps a dummy id for tests
- ASH / zizmor run in app CI; local pre-commit gitleaks / zizmor depend on tools on the developer machine

## Remote MCP

Agents read and write the same D1 ideas over `POST /mcp` (Streamable HTTP). Set `MCP_API_KEY` in `.dev.vars` locally and with `wrangler secret put MCP_API_KEY` in production. The web login stays mocked; MCP does not use it. Tools and client config: [docs/spec/mcp.md](docs/spec/mcp.md).

## Deploy

See [docs/spec/deploy-and-access.md](docs/spec/deploy-and-access.md). Short version:

1. Put a Cloudflare API token (Workers Scripts: Edit + D1 Edit) and Account ID in GitHub secrets
2. D1 `idea-cloud-db` id is already in `wrangler.jsonc`. Do not create a second database of the same name
3. `pnpm db:migrate:remote` (also runs in `deploy.yml` before `wrangler deploy`; wrangler-action does not run `pnpm predeploy`)
4. After visual sign-off, wire in-app Google OAuth (do not invent client secrets). Access middleware comes out in that swap. Cloudflare Access waits until a workers.dev URL is copied from a successful deploy log
5. Push to `main` runs `deploy.yml` (or Actions → Deploy → Run workflow on `main`). PRs get a preview URL from `preview.yml` when secrets exist
