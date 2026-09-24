/**
 * `/api/auth/*` — in-app Google OAuth. Mounted before the session gate in
 * workers/app.ts so these endpoints stay public (docs/spec/oauth-swap.md).
 */
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { logDiag } from "../diag";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";
import {
  authorizationUrl,
  codeChallengeS256,
  exchangeCodeForIdentity,
  randomCodeVerifier,
  randomState,
  redirectUri,
  safeNextPath,
} from "./google-oauth";
import { clearSessionCookie, isLocalRequest, setSessionCookie } from "./session";

const OAUTH_COOKIE = "ic_oauth";
const OAUTH_COOKIE_MAX_AGE = 600;
const DEFAULT_NEXT = "/app";
const LOGIN_PATH = "/login";

type OAuthState = { state: string; verifier: string; next: string };

function setOAuthCookie(c: Parameters<typeof setCookie>[0], value: OAuthState, secure: boolean) {
  setCookie(c, OAUTH_COOKIE, JSON.stringify(value), {
    path: "/api/auth",
    httpOnly: true,
    sameSite: "Lax",
    secure,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
}

function readOAuthCookie(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OAuthState>;
    if (typeof parsed.state !== "string" || typeof parsed.verifier !== "string") return null;
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      next: typeof parsed.next === "string" ? parsed.next : DEFAULT_NEXT,
    };
  } catch {
    return null;
  }
}

function loginError(c: { redirect: (url: string, status?: 302) => Response }, reason: string) {
  return c.redirect(`${LOGIN_PATH}?error=${encodeURIComponent(reason)}`, 302);
}

export const authRoute = new Hono<AppEnv>()
  /**
   * Starts the authorization code flow. On localhost without a Google client,
   * LOCAL_DEV_USER_EMAIL signs in directly so `pnpm dev` / e2e need no secrets.
   */
  .get("/google", async (c) => {
    const next = safeNextPath(c.req.query("next"), DEFAULT_NEXT);
    const clientId = c.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      const devEmail = c.env.LOCAL_DEV_USER_EMAIL?.trim();
      if (isLocalRequest(c.req.url) && devEmail) {
        if (!isEmailAllowed(devEmail, c.env.ACCESS_ALLOWED_EMAILS)) {
          logDiag("warn", "oauth dev login", {
            step: "auth",
            provider: "dev",
            outcome: "fail",
            error: "not_allowed",
            status: 403,
          });
          return loginError(c, "not_allowed");
        }
        if (!(await setSessionCookie(c, devEmail))) return loginError(c, "server_misconfigured");
        logDiag("info", "oauth dev login", {
          step: "auth",
          provider: "dev",
          outcome: "ok",
          status: 302,
        });
        return c.redirect(next, 302);
      }
      logDiag("warn", "oauth start", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: "missing_client",
        status: 302,
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      });
      return loginError(c, "oauth_unconfigured");
    }

    const state = randomState();
    const verifier = randomCodeVerifier();
    setOAuthCookie(c, { state, verifier, next }, !isLocalRequest(c.req.url));
    const url = authorizationUrl({
      clientId,
      redirectUri: redirectUri(c.req.url),
      state,
      codeChallenge: await codeChallengeS256(verifier),
    });
    logDiag("info", "oauth start", {
      step: "auth",
      provider: "google",
      outcome: "ok",
      status: 302,
    });
    return c.redirect(url, 302);
  })
  /** Exchanges the code, applies the allowlist, then sets the session cookie. */
  .get("/google/callback", async (c) => {
    const stored = readOAuthCookie(getCookie(c, OAUTH_COOKIE));
    deleteCookie(c, OAUTH_COOKIE, { path: "/api/auth" });

    const oauthError = c.req.query("error");
    if (oauthError) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: "provider_error",
        status: 302,
      });
      return loginError(c, "google_denied");
    }

    const code = c.req.query("code");
    const state = c.req.query("state");
    if (!code || !state || !stored || state !== stored.state) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: !code ? "missing_code" : !stored ? "missing_state_cookie" : "state_mismatch",
        status: 302,
      });
      return loginError(c, "invalid_request");
    }

    const clientId = c.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) return loginError(c, "oauth_unconfigured");

    let identity;
    try {
      identity = await exchangeCodeForIdentity({
        code,
        codeVerifier: stored.verifier,
        clientId,
        clientSecret,
        redirectUri: redirectUri(c.req.url),
      });
    } catch (error) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: "exchange_failed",
        status: 302,
        detail: error instanceof Error ? error.message : "error",
      });
      return loginError(c, "exchange_failed");
    }

    if (!identity || !identity.emailVerified) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: identity ? "email_unverified" : "no_identity",
        status: 302,
      });
      return loginError(c, "invalid_identity");
    }

    // Fail closed: an email outside the allowlist never gets a session.
    if (!isEmailAllowed(identity.email, c.env.ACCESS_ALLOWED_EMAILS)) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: "not_allowed",
        status: 403,
      });
      return c.redirect(`${LOGIN_PATH}?error=not_allowed`, 302);
    }

    if (!(await setSessionCookie(c, identity.email))) {
      logDiag("warn", "oauth callback", {
        step: "auth",
        provider: "google",
        outcome: "fail",
        error: "missing_session_secret",
        status: 302,
      });
      return loginError(c, "server_misconfigured");
    }
    logDiag("info", "oauth callback", {
      step: "auth",
      provider: "google",
      outcome: "ok",
      status: 302,
    });
    return c.redirect(safeNextPath(stored.next, DEFAULT_NEXT), 302);
  })
  .post("/logout", (c) => {
    clearSessionCookie(c);
    return c.redirect(LOGIN_PATH, 302);
  });
