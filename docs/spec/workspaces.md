# Workspaces (tenancy)

Idea Cloud is multi-tenant. A **workspace** owns ideas, inspirations, categories and saved views; **members** (Google emails) see everything in their workspace and nothing outside it. This is the boundary that makes a public release possible: before migration 0013 every signed-in account shared one shelf and the only fence was `ACCESS_ALLOWED_EMAILS`.

## Model

| Table                | Holds                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `workspaces`         | `id`, `name`, `created_by`                                                                          |
| `workspace_members`  | (`workspace_id`, lowercase `email`) → `role` `owner` \| `member`. Unique per pair, indexed by email |
| `workspace_invites`  | Join links: SHA-256 of the token, role, `expires_at` (7 days), `uses` / `max_uses` (10), revocation |
| `workspace_api_keys` | `/mcp` bearer keys: SHA-256 of the key, display `prefix`, `last_used_at`, revocation                |

`ideas`, `inspirations`, `categories` and `saved_views` carry `workspace_id NOT NULL`. Comments, brainstorms and chat messages hang off `idea_id` and are reached only through an idea in the workspace. There is still no user table: identity is the verified Google email, membership is a row.

`categories` are unique per (`workspace_id`, `name`) and every new workspace is seeded with 執筆アイデア / 事業アイデア / 組織改善.

No SQL foreign key is declared on the new `workspace_id` columns: SQLite refuses to add a `REFERENCES` column that also has a default, and a default was the only way to backfill existing rows in one migration. The application always writes `Db.workspaceId`, which came from a membership row.

## Scoped database handle

`db/client.ts` exports two handles:

- `RootDb` (`createRootDb(env.DB)`) — unscoped. Used only by tenant resolution, billing / entitlements, the Stripe webhook and the workspace settings screen.
- `Db` (`createDb(env.DB, workspaceId)`) — `RootDb` plus `workspaceId`. **Every** function in `db/ideas.ts`, `db/inspirations.ts`, `db/categories.ts`, `db/saved-views.ts`, `db/comments.ts`, `db/brainstorms.ts`, `db/discussions.ts` and `db/search.ts` filters by it. Inserts stamp it. Child-table writes first `UPDATE ideas … WHERE id = ? AND workspace_id = ?` and throw when no row matched.

Call sites do not build a `Db` by hand:

| Where                          | Helper                                       |
| ------------------------------ | -------------------------------------------- |
| React Router loaders / actions | `appDb(context)` (`app/lib/app-db.ts`)       |
| Hono `/api/*` handlers         | `apiDb(c)` (`server/api/db.ts`)              |
| MCP tools                      | `createIdeaCloudMcpServer(env, workspaceId)` |

## Resolving the workspace for a request

`server/tenant/workspace.ts` → `resolveWorkspace(root, email, env, preferredId)`.

1. Load the memberships for the email.
2. **None yet** (first sign-in): bootstrap.
   - Workspace 1 (created by migration 0013, holding every pre-tenancy row) is joined as **owner** when the email is on `ACCESS_ALLOWED_EMAILS`, or when workspace 1 still has no members at all (the first person to sign in on a fresh or upgraded deploy claims it).
   - Otherwise a personal workspace named `<local-part> のワークスペース` is created with the email as owner.
3. Pick `preferredId` if it is one of the memberships, else the lowest id.

`preferredId` comes from the plain `ic_ws` cookie (httpOnly, one year). It is a hint, not a credential: a forged value that is not a membership is ignored. Membership is re-read on every request, so removing a member takes effect immediately.

The page gate (`server/auth/page-gate.ts`) puts the result on `context.workspace` for `/app/**`; `sessionAuth` puts it on `c.get("workspace")` for `/api/*`. Both run after the identity and allowlist checks, which are unchanged.

`ACCESS_ALLOWED_EMAILS` keeps its old meaning (who may sign in at all). For a public release leave it **empty**: anyone with a verified Google account may sign in and lands in their own workspace. For a closed team keep listing the team: they all share workspace 1.

## Invites

Owners create a link in 設定 → メンバーとアクセス. The URL is `/app/join/<token>`; the page gate makes the visitor sign in first, then `acceptInvite` adds them with the invite's role, bumps `uses`, and sets `ic_ws` so they land in that workspace. Only the token hash is stored, so a link cannot be shown again; revoke and reissue instead. Limits: 7 days, 10 uses, 50 members per workspace.

Owners can remove members; anyone can leave (**離脱**). The last owner of a workspace can neither be removed nor leave. Someone who leaves their only workspace gets a fresh personal one.

## API keys for `/mcp`

Owners mint keys in 設定 → API キー（MCP）. A key looks like `icw_<48 hex>`, is shown once, and is stored as SHA-256. `authorizeMcpRequest` maps a presented key to its workspace and stamps `last_used_at`; revoked keys stop at once. Up to 10 live keys per workspace.

The env shared secret (`MCP_API_KEY` / `MCP_TOKEN`) still works but is **legacy**: it only ever opens workspace 1, and it should be unset on a multi-tenant deploy. See [mcp.md](./mcp.md).

`APP_API_TOKEN` (native app) and Google `id_token` bearers are unchanged: both resolve to an email, and the email's membership decides the workspace exactly like a browser session.

## Billing

Plans stay **per email** (`entitlements`, `PREMIUM_EMAILS`), not per workspace: the person who spends AI budget is the one who pays. A premium member working inside a colleague's free workspace still gets AI. This is the simplest rule for launch; a per-workspace plan can be layered later by checking the owner's entitlement instead.

## Upgrading an existing deploy

1. `pnpm db:migrate:remote` — creates the tables, inserts workspace 1, backfills `workspace_id = 1` everywhere.
2. Sign in with an address on `ACCESS_ALLOWED_EMAILS` (or the first address, if the allowlist is empty). That account becomes owner of workspace 1 and sees the old data.
3. Mint a key in 設定 → API キー and move agents off `MCP_API_KEY`; then unset the secret.
4. When ready for the public: clear `ACCESS_ALLOWED_EMAILS`.

## Tests

`test/workspaces.test.ts` covers cross-workspace invisibility at the db and `/api` layer (404, never 403, so ids leak nothing), bootstrap (allowlisted → workspace 1; stranger → personal; forged cookie ignored), the `ic_ws` switch, invites (hash only, uses, expiry, last-owner protection) and workspace keys on `/mcp` (scope, revocation). The two test identities are allowlisted in `wrangler.vitest.jsonc` so the rest of the suite shares workspace 1.
