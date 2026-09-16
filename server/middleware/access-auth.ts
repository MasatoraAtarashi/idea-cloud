import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";

/**
 * Template Cloudflare Access middleware — follow-up: replace with in-app Google OAuth.
 * Production primary gate is Google OAuth + ACCESS_ALLOWED_EMAILS (see docs/spec/oauth-swap.md).
 * Until that swap, APIs still read Cf-Access-Authenticated-User-Email.
 * Localhost / 127.0.0.1 may use LOCAL_DEV_USER_EMAIL from .dev.vars.
 */
export const accessAuth = createMiddleware<AppEnv>(async (c, next) => {
  // squat-auth: begin
  const accessEmail = c.req.header("cf-access-authenticated-user-email");

  let email = accessEmail;
  if (!email) {
    const { hostname } = new URL(c.req.url);
    const isLocal = hostname === "localhost" || hostname.startsWith("127.0.0.1");
    if (isLocal && c.env.LOCAL_DEV_USER_EMAIL) {
      email = c.env.LOCAL_DEV_USER_EMAIL;
    }
  }

  if (!email) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const decoded = decodeURIComponent(email);
  if (!isEmailAllowed(decoded, c.env.ACCESS_ALLOWED_EMAILS)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("userEmail", decoded);
  // squat-auth: end
  await next();
});
