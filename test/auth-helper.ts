/**
 * Signed session cookie for tests. Mirrors what /api/auth/google/callback sets,
 * so API tests exercise the same gate as a browser.
 */
import { env as rawEnv } from "cloudflare:workers";
import { newSessionPayload, SESSION_COOKIE, signSessionValue } from "../server/auth/session";

/**
 * `cloudflare:workers` types `env` as Cloudflare.Env, which does not carry the
 * optional secrets declared in server/env.ts. The Worker sees them as `Env`.
 */
export const testEnv = rawEnv as unknown as Env;

export const TEST_USER_EMAIL = "test@example.com";

export async function sessionCookie(email = TEST_USER_EMAIL): Promise<string> {
  const value = await signSessionValue(newSessionPayload(email), testEnv.SESSION_SECRET!);
  return `${SESSION_COOKIE}=${value}`;
}

/** Spread into `headers` on any `/api/*` request. */
export async function authHeaders(email = TEST_USER_EMAIL): Promise<Record<string, string>> {
  return { cookie: await sessionCookie(email) };
}
