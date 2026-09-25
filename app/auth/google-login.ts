import type { Dictionary } from "../i18n/dictionary";

/** Starts the authorization code flow on the Worker. */
export const GOOGLE_LOGIN_START_PATH = "/api/auth/google";
export const LOGOUT_PATH = "/api/auth/logout";

/** `?error=` values set by server/auth/routes.ts. */
type LoginErrorCode = keyof Dictionary["auth"]["errors"];

function isLoginErrorCode(
  code: string,
  errors: Dictionary["auth"]["errors"],
): code is LoginErrorCode {
  return code in errors;
}

export function loginErrorMessage(t: Dictionary, code: string | null | undefined): string | null {
  if (!code) return null;
  return isLoginErrorCode(code, t.auth.errors) ? t.auth.errors[code] : t.auth.errors.fallback;
}

/** Google sign-in URL that returns to `next` (a same-site path). */
export function googleLoginHref(next: string): string {
  return `${GOOGLE_LOGIN_START_PATH}?next=${encodeURIComponent(next)}`;
}
