/**
 * Signed session cookie for in-app Google OAuth (docs/spec/oauth-swap.md).
 * HMAC-SHA256 over a compact JSON payload; no server-side session store.
 * The cookie is the only credential `/api/*` and `/app/*` accept in production.
 */
import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppEnv } from "../env";

export const SESSION_COOKIE = "ic_session";

/** 14 days. A revoked allowlist entry stops the next request, not this cookie. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

/** Dev-only signing key. Used only on localhost when SESSION_SECRET is unset. */
const LOCAL_DEV_SESSION_SECRET = "idea-cloud-local-dev-session-secret";

export type SessionPayload = {
  /** Verified Google email. */
  email: string;
  /** Issued at (seconds). */
  iat: number;
  /** Expires at (seconds). */
  exp: number;
};

export function isLocalRequest(url: string): boolean {
  const { hostname } = new URL(url);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Signing key. Production requires SESSION_SECRET; localhost falls back to a
 * fixed dev key so `pnpm dev` / e2e work without secrets. Never falls back in
 * production — a missing secret must not silently weaken signatures.
 */
export function sessionSecret(env: Env, requestUrl: string): string | null {
  const configured = env.SESSION_SECRET?.trim();
  if (configured) return configured;
  return isLocalRequest(requestUrl) ? LOCAL_DEV_SESSION_SECRET : null;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  try {
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** `<base64url payload>.<base64url hmac>` */
export async function signSessionValue(payload: SessionPayload, secret: string): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(body),
  );
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** `null` for a bad signature, malformed value, or an expired payload. */
export async function verifySessionValue(
  value: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const signature = base64UrlDecode(value.slice(dot + 1));
  if (!signature) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    signature as unknown as ArrayBuffer,
    new TextEncoder().encode(body),
  );
  if (!valid) return null;
  const decoded = base64UrlDecode(body);
  if (!decoded) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(decoded));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const { email, iat, exp } = parsed as Record<string, unknown>;
  if (typeof email !== "string" || !email) return null;
  if (typeof iat !== "number" || typeof exp !== "number") return null;
  if (exp <= nowSeconds) return null;
  return { email, iat, exp };
}

export function newSessionPayload(
  email: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload {
  return { email, iat: nowSeconds, exp: nowSeconds + SESSION_MAX_AGE_SECONDS };
}

/** httpOnly, SameSite=Lax (OAuth redirect must carry it), Secure off localhost. */
export async function setSessionCookie(c: Context<AppEnv>, email: string): Promise<boolean> {
  const secret = sessionSecret(c.env, c.req.url);
  if (!secret) return false;
  const value = await signSessionValue(newSessionPayload(email), secret);
  setCookie(c, SESSION_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocalRequest(c.req.url),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return true;
}

export function clearSessionCookie(c: Context<AppEnv>) {
  setCookie(c, SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocalRequest(c.req.url),
    maxAge: 0,
  });
}

export async function readSessionEmail(c: Context<AppEnv>): Promise<string | null> {
  const raw = getCookie(c, SESSION_COOKIE);
  if (!raw) return null;
  const secret = sessionSecret(c.env, c.req.url);
  if (!secret) return null;
  const payload = await verifySessionValue(raw, secret);
  return payload?.email ?? null;
}

/** Session email from a raw Request — for the page gate, which has no Hono context. */
export async function readSessionEmailFromRequest(
  request: Request,
  env: Env,
): Promise<string | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`).exec(cookie);
  const raw = match?.[1];
  if (!raw) return null;
  const secret = sessionSecret(env, request.url);
  if (!secret) return null;
  const payload = await verifySessionValue(decodeURIComponent(raw), secret);
  return payload?.email ?? null;
}
