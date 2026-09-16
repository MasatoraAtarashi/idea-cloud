import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";

/** クリックジャッキングと MIME 誤認を抑える基礎ヘッダ。CSP は SSR のインライン都合で次フェーズ。 */
export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});
