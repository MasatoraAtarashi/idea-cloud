/**
 * The one place that turns a request into a signed-in identity.
 * Web browsers present the session cookie set by Google OAuth; the native app
 * presents `Authorization: Bearer <APP_API_TOKEN>` (docs/spec/oauth-swap.md).
 * No user or session table: the allowlist is re-read from env on every request.
 */
import type { Context } from "hono";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";
import { timingSafeEqualString } from "../mcp/auth";
import { verifyGoogleIdToken, looksLikeJwt } from "./google-id-token";
import { readSessionEmail } from "./session";

export type Principal = {
  email: string;
  /** `cookie` = browser session, `google` = native Google Sign-In, `token` = scripted client. */
  via: "cookie" | "google" | "token";
};

function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  return /^Bearer\s+(\S+)\s*$/i.exec(authorization)?.[1] ?? null;
}

/**
 * The app token stands in for a single operator identity, so it needs an email
 * to attribute writes to. APP_API_TOKEN_EMAIL, else the sole allowlist entry.
 */
export function appTokenEmail(env: Env): string | null {
  const explicit = env.APP_API_TOKEN_EMAIL?.trim();
  if (explicit) return explicit;
  const allowlist = (env.ACCESS_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return allowlist.length === 1 ? (allowlist[0] ?? null) : null;
}

function tokenPrincipal(c: Context<AppEnv>): Principal | null {
  const secret = c.env.APP_API_TOKEN?.trim();
  if (!secret) return null;
  const presented = bearerToken(c.req.header("authorization") ?? null);
  if (presented == null || !timingSafeEqualString(presented, secret)) return null;
  const email = appTokenEmail(c.env);
  if (!email) return null;
  return { email, via: "token" };
}

/** Audiences a device-issued `id_token` may carry. */
function googleAudiences(env: Env): string[] {
  return [env.GOOGLE_IOS_CLIENT_ID, env.GOOGLE_CLIENT_ID]
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => !!entry);
}

/**
 * Native Google Sign-In. The device sends the `id_token` it got from Google as
 * the Bearer value; unlike APP_API_TOKEN it is short-lived and per-account.
 */
async function googlePrincipal(c: Context<AppEnv>): Promise<Principal | null> {
  const presented = bearerToken(c.req.header("authorization") ?? null);
  if (presented == null || !looksLikeJwt(presented)) return null;
  const email = await verifyGoogleIdToken(presented, googleAudiences(c.env));
  return email ? { email, via: "google" } : null;
}

/** `null` when the request carries no usable credential. */
export async function resolvePrincipal(c: Context<AppEnv>): Promise<Principal | null> {
  const cookieEmail = await readSessionEmail(c);
  if (cookieEmail) return { email: cookieEmail, via: "cookie" };
  // A JWT-shaped Bearer is a Google id_token; anything else is the app token.
  return (await googlePrincipal(c)) ?? tokenPrincipal(c);
}

export function isPrincipalAllowed(principal: Principal, env: Env): boolean {
  return isEmailAllowed(principal.email, env.ACCESS_ALLOWED_EMAILS);
}
