import { createMiddleware } from "hono/factory";
import { isPremium, PREMIUM_REQUIRED_MESSAGE, PREMIUM_REQUIRED_STATUS } from "../billing/plan";
import type { AppEnv } from "../env";

/**
 * Guards the `/api` endpoints that spend AI budget. Runs after sessionAuth, so
 * `userEmail` is set and the caller is already a member: a 402 here means
 * "authenticated but not entitled", never "not signed in".
 */
export const requirePremium = createMiddleware<AppEnv>(async (c, next) => {
  if (!isPremium(c.get("userEmail"), c.env)) {
    return c.json({ error: PREMIUM_REQUIRED_MESSAGE, plan: "free" }, PREMIUM_REQUIRED_STATUS);
  }
  await next();
});
