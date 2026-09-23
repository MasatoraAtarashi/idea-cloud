# Remote MCP

AI clients (Cursor, Claude Desktop, and anything else that speaks [Model Context Protocol](https://modelcontextprotocol.io)) can read and write the shared idea shelf. The server is the existing Cloudflare Worker and the existing D1 database. There is no second database and no Durable Object.

Discussion stays in the client. MCP exposes data tools only. It does not summarize, brainstorm, auto-tag, research, evaluate, or delete.

## Endpoint

Streamable HTTP, stateless, one URL:

| Where            | URL                                            |
| ---------------- | ---------------------------------------------- |
| Local `pnpm dev` | `http://127.0.0.1:5173/mcp`                    |
| Deployed Worker  | `https://idea-cloud.<account>.workers.dev/mcp` |

Replace `<account>` with the Cloudflare account subdomain. A custom hostname uses the same path: `https://<your-host>/mcp`.

`POST` carries JSON-RPC. Send `Accept: application/json, text/event-stream`. `GET` / `DELETE` session calls are not required; each request stands alone. 2025-era clients receive an SSE `event: message` body. The 2026-07-28 path returns JSON. Tool payloads are JSON either way.

## Auth

Every `/mcp` request needs:

```http
Authorization: Bearer <secret>
```

The Worker reads `MCP_API_KEY`. If that is unset or blank, it reads `MCP_TOKEN`. If both are unset, every request is rejected. A missing or wrong token is `401` with `WWW-Authenticate: Bearer`. The Access email header and the mock Google login do not authenticate MCP.

The secret is a long random string (`openssl rand -hex 32`). Do not commit it.

Local (`.dev.vars`, gitignored):

```bash
cp .dev.vars.example .dev.vars
# set MCP_API_KEY=... in .dev.vars
pnpm db:migrate:local
pnpm dev
```

Production and preview:

```bash
wrangler secret put MCP_API_KEY
```

Cloudflare Access in front of the hostname will block agents before this check. Add an Access bypass (or a separate public path policy) for `/mcp`. The bearer secret is the gate on that path.

`/mcp` is not behind `server/middleware/access-auth.ts`. `/api/*` is unchanged.

## Tools

| Tool                    | Kind  | What it does                                                                                                                                                                                                                                          |
| ----------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_ideas`            | read  | Short rows: `id`, `title`, `stage`, `tags`, `updated_at`. Filter by `stage` or `status` (same field), `tags` (any match), `keyword` (title, body, tags). `limit` (default 20, max 100), `offset`, or `cursor` (`next_cursor` from the previous page). |
| `get_idea`              | read  | Full idea: body, tags, stage, comments, research snapshot and http(s) sources found in the notes when present, plus stored scores, review, and reflection.                                                                                            |
| `search_ideas`          | read  | Case-insensitive substring of title and body. Short rows plus `excerpt`.                                                                                                                                                                              |
| `list_inspirations`     | read  | Inspiration shelf (URL and/or memo) and cached Open Graph fields.                                                                                                                                                                                     |
| `get_analytics_summary` | read  | Same counts as the analytics screen: total, by stage, aged days, scores, reflections, top tags, created per UTC day for 7 and 30 days.                                                                                                                |
| `create_idea`           | write | `title` and/or `body`, optional `tags` and `stage` (default `spark`). No auto-tag and no research. http(s) URLs in the text are copied to the shelf without a page fetch.                                                                             |
| `update_idea`           | write | Patch `title`, `body`, `tags`, and/or `stage` by `id`.                                                                                                                                                                                                |
| `add_comment`           | write | Append a comment. Author is stored as `MCP`.                                                                                                                                                                                                          |
| `create_inspiration`    | write | URL and/or memo, same create rules as the app. A URL triggers the existing Open Graph fetch (public http(s), fail-soft).                                                                                                                              |

Stages: `spark` 着想, `aging` 熟成中, `ripe` 熟した, `selected` 採用, `archived` アーカイブ.

Tool results are JSON text (`content[].text`) and the same object as `structuredContent`.

## Connect

### Cursor (HTTP)

`~/.cursor/mcp.json` or the project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "idea-cloud": {
      "url": "https://idea-cloud.<account>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_API_KEY>"
      }
    }
  }
}
```

### Claude Desktop (`mcp-remote`)

Claude Desktop speaks stdio. [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) proxies that to the Worker:

```json
{
  "mcpServers": {
    "idea-cloud": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://idea-cloud.<account>.workers.dev/mcp",
        "--header",
        "Authorization:${IDEA_CLOUD_AUTHORIZATION}"
      ],
      "env": {
        "IDEA_CLOUD_AUTHORIZATION": "Bearer <MCP_API_KEY>"
      }
    }
  }
}
```

Restart the client after saving. Local dev uses `http://127.0.0.1:5173/mcp` in place of the workers.dev URL.

## Code

| Piece      | Path                                                   |
| ---------- | ------------------------------------------------------ |
| HTTP route | `workers/app.ts` → `server/mcp/http.ts`                |
| Tools      | `server/mcp/server.ts`, `server/mcp/tools.ts`          |
| Auth       | `server/mcp/auth.ts`                                   |
| Data       | Existing Drizzle helpers in `db/` (no parallel schema) |

The handler is `createMcpHandler` from `@modelcontextprotocol/server` (MCP SDK v2, stateless Streamable HTTP). Cloudflare’s older `McpAgent` Durable Object is not used.
