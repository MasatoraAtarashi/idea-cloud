import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";

/**
 * Cloudflare Access auth middleware.
 * Reads identity from the Access email header — no in-app OAuth in this pass.
 * Localhost / 127.0.0.1 may use LOCAL_DEV_USER_EMAIL from .dev.vars.
 * If ACCESS_ALLOWED_EMAILS is set, it is applied after Access (extra allowlist).
 *
 * If the scaffold was generated with auth off, this file is unwired (see squat-auth markers).
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
