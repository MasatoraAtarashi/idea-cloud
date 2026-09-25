/**
 * Verifies a Google `id_token` presented by the native app as a Bearer token.
 *
 * The web flow (google-oauth.ts) exchanges a code over TLS with the client
 * secret, so it can trust the token it gets back without checking the
 * signature. Here the token arrives from a device we do not control, so the
 * signature, issuer, audience and expiry all have to be checked ourselves.
 *
 * No DB: the email is handed to the same ACCESS_ALLOWED_EMAILS check as the
 * cookie path (docs/spec/oauth-swap.md).
 */

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
/** Google mints tokens with a 1h life; allow for modest clock drift only. */
const CLOCK_SKEW_SECONDS = 60;

type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string; use?: string };

type CachedKeys = { keys: Jwk[]; expiresAtMs: number };

/** Module-scoped, so it lives as long as the isolate. Refetched when stale. */
let jwksCache: CachedKeys | null = null;

function base64UrlDecode(segment: string): Uint8Array<ArrayBuffer> {
  const padded = segment.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(segment)));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** `true` when the value has the three dot-separated segments of a JWS. */
export function looksLikeJwt(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

async function fetchJwks(now: number): Promise<Jwk[]> {
  if (jwksCache && jwksCache.expiresAtMs > now) return jwksCache.keys;
  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  // Respect Cache-Control when Google gives one; otherwise a conservative hour.
  const maxAge = /max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1];
  const ttlMs = (maxAge ? Number(maxAge) : 3600) * 1000;
  jwksCache = { keys, expiresAtMs: now + ttlMs };
  return keys;
}

async function verifySignature(token: string, jwk: Jwk): Promise<boolean> {
  const [header, payload, signature] = token.split(".");
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlDecode(signature ?? ""),
    new TextEncoder().encode(`${header}.${payload}`),
  );
}

/**
 * Returns the verified email, or `null` when the token is not a usable Google
 * identity. Never throws for an untrusted token; only for a transport failure
 * reaching Google's keys.
 */
export async function verifyGoogleIdToken(
  token: string,
  audiences: string[],
  nowMs: number = Date.now(),
): Promise<string | null> {
  if (audiences.length === 0 || !looksLikeJwt(token)) return null;

  const [headerSegment, payloadSegment] = token.split(".");
  const header = decodeJson(headerSegment ?? "");
  const payload = decodeJson(payloadSegment ?? "");
  if (!header || !payload) return null;
  // Only RS256 is accepted, so "alg": "none" and HMAC confusion are both out.
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

  const jwk = (await fetchJwks(nowMs)).find((candidate) => candidate.kid === header.kid);
  if (!jwk) return null;
  if (!(await verifySignature(token, jwk))) return null;

  if (typeof payload.iss !== "string" || !ISSUERS.has(payload.iss)) return null;
  if (typeof payload.aud !== "string" || !audiences.includes(payload.aud)) return null;

  const nowSeconds = Math.floor(nowMs / 1000);
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) return null;
  if (typeof payload.iat === "number" && payload.iat - CLOCK_SKEW_SECONDS > nowSeconds) return null;

  // An unverified email would let anyone who can create a Google account with
  // a claimed address through the allowlist.
  if (payload.email_verified !== true) return null;
  const email = payload.email;
  return typeof email === "string" && email.length > 0 ? email : null;
}

/** Test seam: drops the module-scoped JWKS cache. */
export function resetJwksCacheForTest(): void {
  jwksCache = null;
}
