import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  authorizationUrl,
  codeChallengeS256,
  identityFromIdToken,
  redirectUri,
  safeNextPath,
} from "../server/auth/google-oauth";
import { isProtectedPagePath, resolvePageSession } from "../server/auth/page-gate";
import { appTokenEmail } from "../server/auth/principal";
import {
  newSessionPayload,
  SESSION_COOKIE,
  signSessionValue,
  verifySessionValue,
} from "../server/auth/session";
import { authHeaders, sessionCookie, testEnv as env, TEST_USER_EMAIL } from "./auth-helper";

const API = "https://example.com/api/todos";

function idToken(payload: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(payload))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  return `header.${body}.signature`;
}

describe("api session gate", () => {
  it("accepts a signed session cookie", async () => {
    const res = await exports.default.fetch(API, { headers: await authHeaders() });
    expect(res.status).toBe(200);
  });

  it("rejects a request with no credentials", async () => {
    const res = await exports.default.fetch(API);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
  });

  it("rejects a tampered session cookie", async () => {
    const cookie = await sessionCookie();
    // Flip a byte of the payload, not the last char of the signature: the final
    // base64url char of a 32-byte HMAC carries unused bits, so changing it can
    // decode to the same signature and verify.
    const [name, value] = cookie.split("=");
    const tampered = `${name}=${value[0] === "e" ? "f" : "e"}${value.slice(1)}`;
    const res = await exports.default.fetch(API, { headers: { cookie: tampered } });
    expect(res.status).toBe(401);
  });

  it("rejects a cookie signed with another secret", async () => {
    const forged = await signSessionValue(newSessionPayload(TEST_USER_EMAIL), "not-the-secret");
    const res = await exports.default.fetch(API, {
      headers: { cookie: `${SESSION_COOKIE}=${forged}` },
    });
    expect(res.status).toBe(401);
  });

  it("rejects an expired session cookie", async () => {
    const past = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30;
    const value = await signSessionValue(
      { email: TEST_USER_EMAIL, iat: past, exp: past + 60 },
      env.SESSION_SECRET!,
    );
    const res = await exports.default.fetch(API, {
      headers: { cookie: `${SESSION_COOKIE}=${value}` },
    });
    expect(res.status).toBe(401);
  });

  it("accepts the app token as Bearer (native app / scripts)", async () => {
    const res = await exports.default.fetch(API, {
      headers: { authorization: `Bearer ${env.APP_API_TOKEN}` },
    });
    expect(res.status).toBe(200);
  });

  it("rejects a wrong Bearer token", async () => {
    const res = await exports.default.fetch(API, {
      headers: { authorization: "Bearer not-the-token" },
    });
    expect(res.status).toBe(401);
  });

  it("attributes app-token writes to APP_API_TOKEN_EMAIL", () => {
    expect(appTokenEmail(env)).toBe("app@example.com");
    expect(appTokenEmail({ ...env, APP_API_TOKEN_EMAIL: undefined } as Env)).toBeNull();
    expect(
      appTokenEmail({
        ...env,
        APP_API_TOKEN_EMAIL: undefined,
        ACCESS_ALLOWED_EMAILS: "solo@example.com",
      } as Env),
    ).toBe("solo@example.com");
  });
});

describe("session cookie signing", () => {
  it("round-trips a payload", async () => {
    const payload = newSessionPayload("user@example.com");
    const value = await signSessionValue(payload, "secret");
    await expect(verifySessionValue(value, "secret")).resolves.toEqual(payload);
  });

  it("returns null for garbage", async () => {
    await expect(verifySessionValue("nope", "secret")).resolves.toBeNull();
    await expect(verifySessionValue("a.b", "secret")).resolves.toBeNull();
  });
});

describe("google oauth helpers", () => {
  it("builds an authorization URL with PKCE and state", async () => {
    const url = new URL(
      authorizationUrl({
        clientId: "client-id",
        redirectUri: "https://example.com/api/auth/google/callback",
        state: "state-value",
        codeChallenge: await codeChallengeS256("verifier"),
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toContain("email");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("derives the callback URI from the request origin", () => {
    expect(redirectUri("https://idea.example.com/api/auth/google?next=/app")).toBe(
      "https://idea.example.com/api/auth/google/callback",
    );
  });

  it("keeps `next` same-site", () => {
    expect(safeNextPath("/app/list", "/app")).toBe("/app/list");
    expect(safeNextPath("//evil.example.com", "/app")).toBe("/app");
    expect(safeNextPath("https://evil.example.com", "/app")).toBe("/app");
    expect(safeNextPath(null, "/app")).toBe("/app");
  });

  it("reads a verified email from an id_token", () => {
    const token = idToken({
      iss: "https://accounts.google.com",
      aud: "client-id",
      email: "user@example.com",
      email_verified: true,
    });
    expect(identityFromIdToken(token, "client-id")).toEqual({
      email: "user@example.com",
      emailVerified: true,
    });
  });

  it("rejects an id_token for another audience or issuer", () => {
    const wrongAud = idToken({
      iss: "https://accounts.google.com",
      aud: "someone-else",
      email: "user@example.com",
      email_verified: true,
    });
    expect(identityFromIdToken(wrongAud, "client-id")).toBeNull();

    const wrongIss = idToken({
      iss: "https://evil.example.com",
      aud: "client-id",
      email: "user@example.com",
      email_verified: true,
    });
    expect(identityFromIdToken(wrongIss, "client-id")).toBeNull();
  });
});

describe("/api/auth/google", () => {
  it("redirects to /login with an error when no client is configured off localhost", async () => {
    const res = await exports.default.fetch("https://example.com/api/auth/google", {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?error=oauth_unconfigured");
  });

  it("rejects a callback whose state does not match the cookie", async () => {
    const res = await exports.default.fetch(
      "https://example.com/api/auth/google/callback?code=abc&state=forged",
      { redirect: "manual" },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?error=invalid_request");
    expect(res.headers.get("set-cookie") ?? "").not.toContain(SESSION_COOKIE);
  });

  it("rejects a callback with no code", async () => {
    const res = await exports.default.fetch("https://example.com/api/auth/google/callback", {
      redirect: "manual",
    });
    expect(res.headers.get("location")).toBe("/login?error=invalid_request");
  });

  it("reports a Google-side denial", async () => {
    const res = await exports.default.fetch(
      "https://example.com/api/auth/google/callback?error=access_denied",
      { redirect: "manual" },
    );
    expect(res.headers.get("location")).toBe("/login?error=google_denied");
  });

  it("clears the session cookie on logout", async () => {
    const res = await exports.default.fetch("https://example.com/api/auth/logout", {
      method: "POST",
      headers: await authHeaders(),
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login");
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=;`);
  });
});

describe("page gate", () => {
  it("guards /app and leaves the login gate public", () => {
    expect(isProtectedPagePath("/app")).toBe(true);
    expect(isProtectedPagePath("/app/list")).toBe(true);
    expect(isProtectedPagePath("/login")).toBe(false);
    expect(isProtectedPagePath("/")).toBe(false);
  });

  it("redirects a signed-out visitor to /login with a return path", async () => {
    const request = new Request("https://example.com/app/ideas/7?tab=comments");
    const session = await resolvePageSession(request, env);
    expect(session.email).toBeNull();
    expect(session.redirect?.status).toBe(302);
    expect(session.redirect?.headers.get("location")).toBe(
      "/login?next=%2Fapp%2Fideas%2F7%3Ftab%3Dcomments",
    );
  });

  it("lets a signed-in visitor through with their email", async () => {
    const request = new Request("https://example.com/app/list", {
      headers: { cookie: await sessionCookie() },
    });
    const session = await resolvePageSession(request, env);
    expect(session.redirect).toBeNull();
    expect(session.email).toBe(TEST_USER_EMAIL);
  });

  it("does not gate public pages but still reports the session", async () => {
    const signedOut = await resolvePageSession(new Request("https://example.com/login"), env);
    expect(signedOut.redirect).toBeNull();
    expect(signedOut.email).toBeNull();

    const signedIn = await resolvePageSession(
      new Request("https://example.com/login", { headers: { cookie: await sessionCookie() } }),
      env,
    );
    expect(signedIn.email).toBe(TEST_USER_EMAIL);
  });

  it("refuses an email outside the allowlist", async () => {
    const request = new Request("https://example.com/app/list", {
      headers: { cookie: await sessionCookie("stranger@example.com") },
    });
    const session = await resolvePageSession(request, {
      ...env,
      ACCESS_ALLOWED_EMAILS: TEST_USER_EMAIL,
    } as Env);
    expect(session.email).toBeNull();
    expect(session.redirect?.status).toBe(302);
  });
});
