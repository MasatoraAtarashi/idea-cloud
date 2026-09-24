/**
 * Page gate for SSR routes. `/` and `/login` are the public login gate;
 * everything under `/app` needs a session (docs/spec/oauth-swap.md step 4).
 * `/api` and `/mcp` have their own gates and never reach this.
 */
import { isEmailAllowed } from "../security/allowlist";
import { readSessionEmailFromRequest } from "./session";

const PROTECTED_PREFIX = "/app";
const LOGIN_PATH = "/login";

export function isProtectedPagePath(pathname: string): boolean {
  return pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);
}

export function loginRedirectUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  const next = `${url.pathname}${url.search}`;
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

export type PageSession =
  /** Allowed to render. `email` is null on public pages with no session. */
  | { redirect: null; email: string | null }
  /** Protected page without an allowed session. */
  | { redirect: Response; email: null };

export async function resolvePageSession(request: Request, env: Env): Promise<PageSession> {
  const { pathname } = new URL(request.url);
  const rawEmail = await readSessionEmailFromRequest(request, env);
  const email = rawEmail && isEmailAllowed(rawEmail, env.ACCESS_ALLOWED_EMAILS) ? rawEmail : null;
  if (email || !isProtectedPagePath(pathname)) return { redirect: null, email };
  // Built by hand: Response.redirect() returns immutable headers, which the
  // security-headers middleware cannot then add to.
  return {
    redirect: new Response(null, {
      status: 302,
      headers: { location: loginRedirectUrl(request.url) },
    }),
    email: null,
  };
}
