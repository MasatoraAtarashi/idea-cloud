import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { isEmailAllowed } from "../security/allowlist";

/**
 * Cloudflare Access 認証ミドルウェア。
 * Access が付与するヘッダからユーザー ID（メール）を読むだけなので、アプリ側に認証コードは不要。
 * ローカル開発時は localhost に限り .dev.vars の LOCAL_DEV_USER_EMAIL でバイパスできる。
 * ACCESS_ALLOWED_EMAILS があれば、Access 通過後にアプリ側でも許可リストを見る（Google ログイン + 制限）。
 *
 * 認証を無効化して scaffold した場合、このファイルは配線から外れます（squat-auth マーカー参照）。
 */
export const accessAuth = createMiddleware<AppEnv>(async (c, next) => {
  // squat-auth: begin
  const accessEmail = c.req.header("cf-access-authenticated-user-email");

  let email = accessEmail;
  if (!email) {
    const { hostname } = new URL(c.req.url);
    const isLocal = hostname === "localhost" || hostname.startsWith("127.0.0.1");
    if (isLocal && c.env.LOCAL_DEV_USER_EMAIL) {
      email = c.env.LOCAL_DEV_USER_EMAIL;
    }
  }

  if (!email) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const decoded = decodeURIComponent(email);
  if (!isEmailAllowed(decoded, c.env.ACCESS_ALLOWED_EMAILS)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("userEmail", decoded);
  // squat-auth: end
  await next();
});
