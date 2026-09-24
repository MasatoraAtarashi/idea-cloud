/** Japanese copy and paths for the Google sign-in gate on /login. */
export const GOOGLE_LOGIN_CTA = "Google で続行";
export const LOGIN_TAGLINE = "思いつきを預け、寝かせ、熟した頃に見返す。";
export const GOOGLE_LOGIN_NOTE = "組織アカウントのみ利用できます";

/** Starts the authorization code flow on the Worker. */
export const GOOGLE_LOGIN_START_PATH = "/api/auth/google";
export const LOGOUT_PATH = "/api/auth/logout";

/** `?error=` values set by server/auth/routes.ts. */
const LOGIN_ERRORS: Record<string, string> = {
  not_allowed: "このアカウントは許可されていません。管理者に連絡してください。",
  google_denied: "Google 側でログインがキャンセルされました。",
  invalid_request: "ログインの途中で情報が失われました。もう一度お試しください。",
  invalid_identity: "メールアドレスが確認できませんでした。別のアカウントでお試しください。",
  exchange_failed: "Google との通信に失敗しました。時間をおいて再度お試しください。",
  oauth_unconfigured: "サーバー側の Google 設定が未完了です。",
  server_misconfigured: "サーバー側の設定が未完了です。",
};

export function loginErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return LOGIN_ERRORS[code] ?? "ログインできませんでした。もう一度お試しください。";
}

/** Google sign-in URL that returns to `next` (a same-site path). */
export function googleLoginHref(next: string): string {
  return `${GOOGLE_LOGIN_START_PATH}?next=${encodeURIComponent(next)}`;
}
