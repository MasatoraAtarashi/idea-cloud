import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";

/**
 * Template Cloudflare Access middleware — follow-up: replace with in-app Google OAuth (#48).
 * Production primary gate is Google OAuth + ACCESS_ALLOWED_EMAILS (see docs/spec/oauth-swap.md).
 *
 * Temporary until that swap: when the Access email header is absent, `AUTH_MOCK=1`
 * plus `LOCAL_DEV_USER_EMAIL` identifies the caller on any host (including workers.dev).
 * Localhost / 127.0.0.1 still accepts `LOCAL_DEV_USER_EMAIL` without the flag.
 * A present Access header wins and ignores the mock. `ACCESS_ALLOWED_EMAILS` still
 * applies whenever that list is non-empty.
 *
 * Cloudflare strips client-supplied `Cf-*` headers, so curl cannot spoof
 * `Cf-Access-Authenticated-User-Email` on workers.dev. The header is only
 * trustworthy when Access itself injects it.
 */
function mockUserEmail(env: Env, hostname: string): string | undefined {
  const email = env.LOCAL_DEV_USER_EMAIL?.trim();
  if (!email) return undefined;
  const isLocal = hostname === "localhost" || hostname.startsWith("127.0.0.1");
  if (isLocal || env.AUTH_MOCK === "1") return email;
  return undefined;
}

export const accessAuth = createMiddleware<AppEnv>(async (c, next) => {
  // squat-auth: begin
  const accessEmail = c.req.header("cf-access-authenticated-user-email")?.trim();
  const email = accessEmail || mockUserEmail(c.env, new URL(c.req.url).hostname);

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
