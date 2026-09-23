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
    /** TypeSafe Jev (System One). When set, auto-tags and AI評価 prefer Jev. */
    TYPESAFE_API_KEY?: string;
    /** Shared secret for `Authorization: Bearer` on `/mcp`. Prefer this over MCP_TOKEN. */
    MCP_API_KEY?: string;
    /** Accepted only when MCP_API_KEY is unset. */
    MCP_TOKEN?: string;
    /** Optional Brave Search API key. When unset, research uses HTML search pages. */
    SEARCH_API_KEY?: string;
  }
}
