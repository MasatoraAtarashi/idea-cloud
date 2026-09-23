# Deploy and Cloudflare Access

First production deploy of Idea Cloud. **Do not invent Cloudflare or Google credentials.** Do not print secret values. If a step needs a missing secret, stop and leave a checklist.

## Status

| Item                                                           | State                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Recorded as **registered** on 2026-09-16 (values never committed). Confirm they are still set before a production deploy. Dependabot PRs do not receive Actions secrets, so a failed preview upload is not proof they are gone. |
| D1 `idea-cloud-db`                                             | **Exists** — `c49e0fd3-b7e4-422e-b3fc-019bf0264dab` (APAC), patched in `wrangler.jsonc`                                                                                                                                         |
| Remote migrations on 2026-09-16                                | Template `todos` was present; `d1_migrations` recorded `0000_high_songbird.sql`. Idea and member tables were **not** created at that check.                                                                                     |
| Migrations in git now                                          | `0001`–`0008` add `ideas`, comments, brainstorms, saved views, inspirations (including OGP), and `research_sources`. `deploy.yml` applies them remotely before deploy. Do not create a second database of the same name.        |
| Members table                                                  | **Not created** (no migration)                                                                                                                                                                                                  |
| Worker script `idea-cloud`                                     | **Exists** on the account                                                                                                                                                                                                       |
| Confirmed `*.workers.dev` URL in this runbook                  | **Not recorded yet** — copy it from a successful `deploy.yml` log or the dashboard. Do not invent a hostname.                                                                                                                   |
| Cloudflare Access (Zero Trust)                                 | **Deferred** until that URL is confirmed                                                                                                                                                                                        |
| `wrangler.vitest.jsonc` `database_id`                          | Dummy `00000000-0000-0000-0000-000000000000` on purpose for vitest-pool-workers. Do not copy it into `wrangler.jsonc`.                                                                                                          |

## Access vs in-app OAuth

- **This deploy** can sit behind **Cloudflare Access** (Zero Trust) once a hostname exists. Access is deferred until that URL is copied from a real deploy.
- **In-app Google OAuth** is the product auth model. It is not a substitute for Access, and Access is not the OAuth implementation. See [security.md](./security.md) and [oauth-swap.md](./oauth-swap.md).
- **This UI pass:** login is a Google-looking mock. Template Access middleware still guards `/api/*`. It comes out in the OAuth swap.

## GitHub secrets required

| Secret                  | Purpose                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler deploy. Least privilege: Workers Scripts **Edit**, plus D1 **Edit** so CI can apply migrations |
| `CLOUDFLARE_ACCOUNT_ID` | Account for that token                                                                                  |

Optional later: wrangler secrets `ACCESS_ALLOWED_EMAILS`, `FIELD_ENCRYPTION_KEY` (not needed until those features are wired in production), `TYPESAFE_API_KEY` (Jev auto-tags + AI評価; falls back to Workers AI when unset), `MCP_API_KEY` (required before agents can call `/mcp`; see [mcp.md](./mcp.md)), `SEARCH_API_KEY` (optional Brave Search for リサーチ 先行事例; HTML search is the default when unset). OAuth swap later: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

Do not invent or commit these values. Production: GitHub Actions secrets for deploy; `wrangler secret put` for Worker runtime secrets.

## D1

Live binding in `wrangler.jsonc`:

```jsonc
{
  "binding": "DB",
  "database_name": "idea-cloud-db",
  "database_id": "c49e0fd3-b7e4-422e-b3fc-019bf0264dab",
  "migrations_dir": "migrations",
  "migrations_table": "d1_migrations",
}
```

Notes:

1. `wrangler d1 create idea-cloud-db` already ran. Do not create a second database of the same name.
2. `deploy.yml` runs `wrangler d1 migrations apply DB --remote` **before** `wrangler deploy`. `package.json` `predeploy` does the same for local `pnpm deploy`. wrangler-action does **not** run `pnpm predeploy`, so the workflow step is required.
3. Wrangler v4 defaults to local mode; CI **must** pass `--remote`.
4. Local: `pnpm db:migrate:local`. Remote (with a real token): `pnpm db:migrate:remote`.

Workers AI research uses the `AI` binding. No extra wrangler secret for that path. Auto-tags and AI評価 prefer TypeSafe Jev when `TYPESAFE_API_KEY` is set. Optional `SEARCH_API_KEY` uses Brave Search for 先行事例; otherwise the Worker fetches DuckDuckGo/Bing HTML. The deploy token needs permission to run Workers AI in production.

## Workflows

| Workflow                        | Trigger                                              | Notes                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy.yml`  | Push to `main`, or `workflow_dispatch` **on `main`** | Job is gated with `github.ref == 'refs/heads/main'` so a dispatch from another branch cannot publish production. Applies D1 migrations, then deploys. |
| `.github/workflows/preview.yml` | Pull requests                                        | Uploads a Worker version / preview URL when secrets exist                                                                                             |
| `.github/workflows/pr.yml`      | PRs                                                  | typecheck / lint / test / gitleaks / zizmor / audit / ASH                                                                                             |

Cloudflare GitHub OIDC for wrangler deploy is not available; CI uses the API token pair above.

After merge, a hostname comes from the `main` push deploy **or** Actions → Deploy → Run workflow on `main`.

## Zero Trust application

Do this only once a real Worker hostname is known. Until then Access stays deferred.

1. Cloudflare Zero Trust → Access → Applications → Self-hosted / Worker.
2. Include the production hostname from the deploy log / dashboard.
3. Identity: Google.
4. Policy: allow listed emails only (Atarashi Lab).
5. **Path policy:** `/` and `/login` are the public login gate. Require Access (or later in-app OAuth) for `/app` and `/api`. Bypass `/mcp` so MCP clients can present `Authorization: Bearer` (`MCP_API_KEY`) without an Access session.
6. After Access, optional app-level `ACCESS_ALLOWED_EMAILS` matches the same set.

## First successful URL

Report a live URL only after:

- `deploy.yml` succeeded on `main`
- the hostname is copied from that job log (or the Worker dashboard), not guessed
- Access is either attached **or** still explicitly deferred (this runbook)

Until then, local review is `pnpm dev` → http://localhost:5173.

## Local

```bash
cp .dev.vars.example .dev.vars
# LOCAL_DEV_USER_EMAIL=you@example.com
pnpm db:migrate:local
pnpm dev
```
