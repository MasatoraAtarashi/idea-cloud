import { createMiddleware } from "hono/factory";
import { isPrincipalAllowed, resolvePrincipal } from "../auth/principal";
import type { AppEnv } from "../env";

/**
 * Primary gate for `/api/*`. Accepts the Google OAuth session cookie (web) or
 * `Authorization: Bearer <APP_API_TOKEN>` (native app). `/api/auth/*` and
 * `/mcp` are mounted outside this middleware.
 * The allowlist is re-checked per request, so removing an email takes effect
 * before an already-issued cookie expires.
 */
export const sessionAuth = createMiddleware<AppEnv>(async (c, next) => {
  const principal = await resolvePrincipal(c);
  if (!principal) {
    c.header("www-authenticate", 'Bearer realm="idea-cloud"');
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!isPrincipalAllowed(principal, c.env)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("userEmail", principal.email);
  await next();
});
