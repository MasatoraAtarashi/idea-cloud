# Idea Cloud

Team workspace for capturing ideas, leaving them alone, and reviewing them after they have matured. Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学). Japanese product name: アイデアクラウド.

## Language

- **Documentation** (this README, `docs/spec/`, design notes): English.
- **Product UI copy**: Japanese.

This repo is a **screen-alignment first pass**: public landing page plus a clickable UI shell. Persistence, production auth, and AI are stubs.

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
pnpm db:migrate:local            # template sample `todos` table
pnpm dev
```

http://localhost:5173 is the public LP. **はじめる** opens the mock app.

| Path             | Screen (Japanese UI)      |
| ---------------- | ------------------------- |
| `/`              | Public landing page       |
| `/login`         | Login (Google OAuth mock) |
| `/app/capture`   | Quick capture             |
| `/app`           | Aging board (kanban)      |
| `/app/ideas/:id` | Idea detail               |
| `/app/merge`     | Merge / related           |
| `/app/research`  | Research / prototype      |
| `/app/team`      | Team settings             |

## What was copied from the template

`MasatoraAtarashi/app-template` is not a GitHub Template Repository, so `gh repo create --template` was not used. This app was copied from squat’s **`personal-fullstack`** template (strict tier, Cloudflare Access auth).

**Visual language (honest):** the _stack_ is from the template. The first dark + gold UI was **not** LiteLLM. Working screens now follow the LiteLLM dashboard **default light** mode: white panels, cool gray borders, navy primary, desktop sidebar.

Included:

- React Router v7 (SSR) + Tailwind CSS 4 + Hono on Cloudflare Workers
- D1 + Drizzle (sample `todos` API kept; not used by the product UI)
- Cloudflare Access middleware (`Cf-Access-Authenticated-User-Email`) — leftover; product auth is in-app Google OAuth
- CI: typecheck / lint / test + gitleaks / zizmor / pnpm audit / ASH (`.github/workflows/pr.yml`)
- lefthook, Dependabot, observability on by default

## Stubs / not wired

- **Login:** `/login` looks like Sign in with Google and currently navigates to `/app` (mock). Real OAuth is [docs/spec/oauth-swap.md](docs/spec/oauth-swap.md).
- **Allowlist:** `ACCESS_ALLOWED_EMAILS` (comma-separated). Second layer after Google identity. The team-settings textarea is disabled.
- **Field encryption:** AES-GCM helper in `server/security/field-crypto.ts`. No idea table in D1 yet.
- **Workers AI:** tagging / relation / evolution copy only. No unused AI binding in `wrangler.jsonc`.
- **D1 `database_id`:** placeholder. Create with `wrangler d1 create idea-cloud-db` before first deploy.
- Sample `/api/todos` remains for template verification.

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
3. After visual sign-off, wire in-app Google OAuth (do not invent client secrets). Access middleware comes out in that swap.
4. Push to `main` runs `deploy.yml`. PRs get a preview URL from `preview.yml` when secrets exist
