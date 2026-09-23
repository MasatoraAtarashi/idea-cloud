// テスト用 Worker エントリ: 本番（workers/app.ts）と同じ /api マウント構成にする。
// React Router の virtual モジュールを import しないため、vitest でそのまま動く。
import { Hono } from "hono";
import { api } from "../server/api";
import { handleMcpRequest } from "../server/mcp/http";
import { securityHeaders } from "../server/middleware/security-headers";
import type { AppEnv } from "../server/env";

const app = new Hono<AppEnv>();
app.use("*", securityHeaders);
app.all("/mcp", (c) => handleMcpRequest(c.req.raw, c.env));
app.route("/api", api);

export default app;
