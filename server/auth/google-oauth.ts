/**
 * Google authorization code flow with PKCE (docs/spec/oauth-swap.md step 1-3).
 * The code is exchanged server-side over TLS with the client secret, so the
 * returned `id_token` is trusted without a separate JWKS signature check.
 */
import { safeNextPath } from "../../app/lib/next-path";

export { safeNextPath };

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_SCOPE = "openid email";

export const CALLBACK_PATH = "/api/auth/google/callback";

export type GoogleIdentity = { email: string; emailVerified: boolean };

function randomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function randomState(): string {
  return randomBase64Url(32);
}

export function randomCodeVerifier(): string {
  return randomBase64Url(32);
}

export async function codeChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function redirectUri(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}${CALLBACK_PATH}`;
}

export function authorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Decode the `id_token` payload. The token came straight from Google's token endpoint. */
export function decodeIdTokenPayload(idToken: string): Record<string, unknown> | null {
  const parts = idToken.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  const padded = parts[1].replaceAll("-", "+").replaceAll("_", "/");
  try {
    const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const parsed = JSON.parse(
      decodeURIComponent(
        Array.from(json)
          .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      ),
    );
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function identityFromIdToken(
  idToken: string,
  expectedAudience: string,
): GoogleIdentity | null {
  const payload = decodeIdTokenPayload(idToken);
  if (!payload) return null;
  const { email, email_verified: emailVerified, aud, iss } = payload;
  if (typeof email !== "string" || !email.includes("@")) return null;
  if (aud !== expectedAudience) return null;
  if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") return null;
  return { email, emailVerified: emailVerified === true || emailVerified === "true" };
}

/** Exchanges the authorization code. Throws `Error("status <n>")` on a non-2xx. */
export async function exchangeCodeForIdentity(input: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<GoogleIdentity | null> {
  const doFetch = input.fetchImpl ?? fetch;
  const res = await doFetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.codeVerifier,
    }).toString(),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const body = (await res.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") return null;
  return identityFromIdToken(body.id_token, input.clientId);
}
