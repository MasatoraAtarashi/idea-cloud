import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { api } from "../server/api";
import { handleMcpRequest } from "../server/mcp/http";
import { securityHeaders } from "../server/middleware/security-headers";
import type { AppEnv } from "../server/env";

const app = new Hono<AppEnv>();

app.use("*", securityHeaders);

// Agents (Cursor, Claude Desktop). Bearer token, not Access middleware.
app.all("/mcp", (c) => handleMcpRequest(c.req.raw, c.env));

// API ルート（Hono）。ルートの追加は server/api/ 側で行う
app.route("/api", api);

// Pages and resource-route actions (POST 作成). /api is registered first.
app.all("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
