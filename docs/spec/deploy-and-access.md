# Deploy and Cloudflare Access

First production deploy of Idea Cloud. **Do not invent Cloudflare credentials.** If GitHub secrets are missing, stop and leave a checklist — do not fake a URL.

## Access vs in-app OAuth

- **This deploy** is protected by **Cloudflare Access** (Zero Trust) in front of the Worker.
- **In-app Google OAuth** is a later product feature. It is not a substitute for Access on this pass, and Access is not “the OAuth implementation.”

## GitHub secrets required

| Secret                  | Purpose                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler deploy. Workers Scripts: Edit, plus D1 edit if migrations run in CI |
| `CLOUDFLARE_ACCOUNT_ID` | Account for that token                                                       |

Optional later: wrangler secrets `ACCESS_ALLOWED_EMAILS`, `FIELD_ENCRYPTION_KEY` (not needed until those features are wired in production), `TYPESAFE_API_KEY` (Jev auto-tags + AI評価; falls back to Workers AI when unset), `MCP_API_KEY` (required before agents can call `/mcp`; see [mcp.md](./mcp.md)).

## D1

`wrangler.jsonc` currently has placeholder `database_id` `00000000-0000-0000-0000-000000000000`. Deploy will fail or point at nothing until a real database exists.

Intended steps (run only with a real token; do not commit the token):

1. `wrangler d1 create idea-cloud-db` (or `wrangler d1 list` if it already exists)
2. Patch `database_id` in `wrangler.jsonc`
3. `wrangler d1 migrations apply DB --remote` (or `pnpm db:migrate:remote`) applies `todos` + `ideas` (including research, review, reflection columns, comments, brainstorms, saved views, inspirations + OGP columns)
4. Production `deploy.yml` runs the same `d1 migrations apply DB --remote` before `wrangler deploy`. Local: `pnpm db:migrate:local`

Workers AI research uses the `AI` binding. No extra wrangler secret for that path. Auto-tags and AI評価 prefer TypeSafe Jev when `TYPESAFE_API_KEY` is set (`wrangler secret put TYPESAFE_API_KEY` / `.dev.vars`). The deploy token needs permission to run Workers AI in production.

## Workflows

| Workflow                        | Trigger today  | Notes                                                                                 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `.github/workflows/deploy.yml`  | Push to `main` | D1 migrations (`ideas` + `todos`, including research columns) then production Worker. |
| `.github/workflows/preview.yml` | Pull requests  | Uploads a Worker version / preview URL when secrets exist                             |
| `.github/workflows/pr.yml`      | PRs            | typecheck / lint / test / gitleaks / zizmor / audit / ASH                             |

`workflow_dispatch` on deploy is a follow-up so first-deploy can run without merging placeholder D1.

## Zero Trust application

1. Cloudflare Zero Trust → Access → Applications → Self-hosted / Worker.
2. Include the production hostname.
3. Identity: Google.
4. Policy: allow listed emails only (Atarashi Lab).
5. **Path policy:** `/` and `/login` are the public login gate. Require Access (or later in-app OAuth) for `/app` and `/api`. Bypass `/mcp` so MCP clients can present `Authorization: Bearer` (`MCP_API_KEY`) without an Access session.
6. After Access, optional app-level `ACCESS_ALLOWED_EMAILS` matches the same set.

## First successful URL

Report a live URL only after:

- secrets exist in the GitHub repo
- real D1 id is in `wrangler.jsonc` on the deployed ref
- `deploy.yml` (or a manual wrangler deploy) succeeded
- Access policy is attached (or explicitly deferred with a written reason)

Until then, local review is `pnpm dev` → http://localhost:5173.

## Local

```bash
cp .dev.vars.example .dev.vars
# LOCAL_DEV_USER_EMAIL=you@example.com
pnpm db:migrate:local
pnpm dev
```
