// Hono アプリの環境型（Bindings は worker-configuration.d.ts の Env を使用）
export type AppEnv = {
  Bindings: Env;
  Variables: {
    requestId: string;
    userEmail: string;
  };
};

declare global {
  interface Env {
    // .dev.vars でローカル開発時にだけ定義される（本番では未定義）
    LOCAL_DEV_USER_EMAIL?: string;
    /** Comma-separated emails. Second layer after Google identity. Empty = identity only. */
    ACCESS_ALLOWED_EMAILS?: string;
    /** 32 バイト hex。未配線（フィールド暗号化スタブ用） */
    FIELD_ENCRYPTION_KEY?: string;
  }
}
