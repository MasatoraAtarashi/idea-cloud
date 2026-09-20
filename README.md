# Idea Cloud

Team workspace for capturing ideas, leaving them alone, and reviewing them after they have matured. Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学). Japanese product name: アイデアクラウド.

## Language

- **Documentation** (this README, `docs/spec/`, design notes): English.
- **Product UI copy**: Japanese.

Quiet login gate plus a working create/list/detail loop. Ideas persist to D1. Login is still a Google-looking **mock** (no OAuth). No landing page. No dummy seed data.

## Specs

| Doc                                                                    | What it covers                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| [docs/spec/product-requirements.md](docs/spec/product-requirements.md) | Product goals, stages, out of scope                         |
| [docs/spec/architecture.md](docs/spec/architecture.md)                 | Stack, bindings, what came from the template                |
| [docs/spec/ui-ia.md](docs/spec/ui-ia.md)                               | Screens, IA, visual language                                |
| [docs/spec/security.md](docs/spec/security.md)                         | In-app Google OAuth + allowlist, field crypto               |
| [docs/spec/deploy-and-access.md](docs/spec/deploy-and-access.md)       | First deploy, D1 checklist                                  |
| [docs/spec/oauth-swap.md](docs/spec/oauth-swap.md)                     | Follow-up: replace Access middleware with real Google OAuth |

UI previews (desktop ~1280px / mobile ~390px): [docs/ui-previews/](docs/ui-previews/).

## Run locally

```bash
pnpm install
cp .dev.vars.example .dev.vars   # set LOCAL_DEV_USER_EMAIL to your address
pnpm db:migrate:local            # D1 `todos` + `ideas` + comments / brainstorms / saved views / inspirations
pnpm dev
```

http://localhost:5173/app is new-idea compose on a phone. Desktop `/app` replaces to `/app/list`.

| Path                | Screen (Japanese UI)                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/app`              | Mobile home: 新規アイデア. Desktop → `/app/list`                                                                                             |
| `/app/capture`      | Compose alias (desktop opens the list modal)                                                                                                 |
| `/app/list`         | Idea list (desktop home; mobile 一覧). Views: `?tab=aging`, `?tab=candidates`, `?tab=tried`, `?view=board`, `?stage=`, `?tag=`, `?q=`, `?v=` |
| `/app/ideas/:id`    | Idea detail (コメント, 見直し, 振り返り, 融合 / リサーチ / ブレスト as per-idea actions)                                                     |
| `/app/inspirations` | Inspiration shelf (URL / memo). Detail can kick **AIブレスト** into a new idea                                                               |
| `/app/analytics`    | Light counts from D1 idea rows                                                                                                               |
| `/app/merge`        | Merge deep link (not in primary nav)                                                                                                         |
| `/app/research`     | Research deep link (redirects `from` to idea detail)                                                                                         |
| `/app/settings`     | Settings (team / access)                                                                                                                     |
| `/app/team`         | Redirects to settings                                                                                                                        |

## What was copied from the template

`MasatoraAtarashi/app-template` is not a GitHub Template Repository, so `gh repo create --template` was not used. This app was copied from squat’s **`personal-fullstack`** template (strict tier, Cloudflare Access auth).

**Visual language (honest):** the _stack_ is from the template. In-app chrome is a quiet light console (Linear-leaning IA, white surfaces, pastel stage pills, original cloud mark). Relic’s logo and blue marketing LP are not used.

Included:

- React Router v7 (SSR) + Tailwind CSS 4 + Hono on Cloudflare Workers
- D1 + Drizzle (`ideas` for the product UI; sample `todos` API kept)
- Cloudflare Access middleware (`Cf-Access-Authenticated-User-Email`) — leftover; product auth is in-app Google OAuth
- CI: typecheck / lint / test + gitleaks / zizmor / pnpm audit / ASH (`.github/workflows/pr.yml`)
- lefthook, Dependabot, observability on by default

## Stubs / not wired

- **Login:** `/login` looks like Sign in with Google and currently navigates to `/app` (mock). `/app` is new-idea compose; desktop replaces to `/app/list`. Real OAuth is [docs/spec/oauth-swap.md](docs/spec/oauth-swap.md).
- **Allowlist:** `ACCESS_ALLOWED_EMAILS` (comma-separated). Second layer after Google identity. Settings shows a stub, not a working Access editor.
- **Ideas:** D1 `ideas` table. **作成** inserts a row; `/app/list` and `/app/ideas/:id` load from D1. Shared workspace; no owner column; no field encryption. Detail **コメント** persist in `idea_comments` (mock author). List rows show tags, stage, updated, aging, comment count, and research. Named **ビュー** persist in `saved_views`.
- **Field encryption:** AES-GCM helper in `server/security/field-crypto.ts`. Not applied to idea rows.
- **Workers AI / Jev:** per-idea research and brainstorm on `/app/ideas/:id` from **着想** onward stay on Workers AI (summarize/analyze or expand stored text; no web search). **AI評価** and **作成** auto-tags prefer TypeSafe Jev (`jev-latest`) when `TYPESAFE_API_KEY` is set, else the Workers AI fast/standard models. Archive stays blocked. Failures still create the idea and show **自動タグなし**. Binding `AI` in `wrangler.jsonc`. Relation / evolution still copy-only.
- Sample `/api/todos` remains for template verification. `/api/ideas` mirrors that CRUD style (Access middleware still on `/api`).

Env template: `.dev.vars.example`. Do not commit secret values. Production: `wrangler secret put`.

## Known template gaps

- `app-template` is a squat CLI + multi-template monorepo, not a single app
- GitHub **template flag is false** (as of 2026-09)
- Team purpose (`team-admin`) is coming soon; `personal-fullstack` is the closest ready template
- Auth in code today is still the template **Cloudflare Access** middleware. Production model is **in-app Google OAuth** + allowlist ([app-template#28](https://github.com/MasatoraAtarashi/app-template/issues/28))
- Cloudflare GitHub OIDC for wrangler deploy is not available; deploy CI uses `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
- Generated `wrangler.jsonc` D1 id is a dummy until first create
- ASH / zizmor run in app CI; local pre-commit gitleaks / zizmor depend on tools on the developer machine

## Deploy

See [docs/spec/deploy-and-access.md](docs/spec/deploy-and-access.md). Short version:

1. Put a Cloudflare API token (Workers Scripts: Edit) and Account ID in GitHub secrets
2. Create D1 and patch `wrangler.jsonc` `database_id`
3. `pnpm db:migrate:remote` (also runs in `deploy.yml` before `wrangler deploy`)
4. After visual sign-off, wire in-app Google OAuth (do not invent client secrets). Access middleware comes out in that swap.
5. Push to `main` runs `deploy.yml`. PRs get a preview URL from `preview.yml` when secrets exist
