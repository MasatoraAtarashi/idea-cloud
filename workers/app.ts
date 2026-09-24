import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { api } from "../server/api";
import { resolvePageSession } from "../server/auth/page-gate";
import { authRoute } from "../server/auth/routes";
import { resolvePlanForEnv } from "../server/billing/plan";
import { billingWebhookRoute } from "../server/billing/webhook-route";
import { handleMcpRequest } from "../server/mcp/http";
import { securityHeaders } from "../server/middleware/security-headers";
import type { AppEnv } from "../server/env";

const app = new Hono<AppEnv>();

app.use("*", securityHeaders);

// Agents (Cursor, Claude Desktop). Bearer token, not Access middleware.
app.all("/mcp", (c) => handleMcpRequest(c.req.raw, c.env));

// In-app Google OAuth. Mounted before /api so it stays outside the session gate.
app.route("/api/auth", authRoute);

// Stripe webhook. Mounted before /api so it stays outside the session gate:
// its credential is the signature, not a cookie.
app.route("/api/billing/webhook", billingWebhookRoute);

// API ルート（Hono）。ルートの追加は server/api/ 側で行う
app.route("/api", api);

// Pages and resource-route actions (POST 作成). /api is registered first.
app.all("*", async (c) => {
  const session = await resolvePageSession(c.req.raw, c.env);
  if (session.redirect) return session.redirect;

  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
    userEmail: session.email,
    plan: await resolvePlanForEnv(session.email, c.env),
  });
});

export default app;
