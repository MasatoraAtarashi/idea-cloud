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
    /**
     * localhost-only stand-in for a Google sign-in. `/api/auth/google` signs this
     * email in directly when no Google client is configured (dev / e2e).
     */
    LOCAL_DEV_USER_EMAIL?: string;
    /** Google OAuth web client. `wrangler secret` / .dev.vars only. */
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    /** HMAC key for the session cookie. Required in production. */
    SESSION_SECRET?: string;
    /**
     * Personal API token for the native app / scripts: `Authorization: Bearer`.
     * Swapped for native Google Sign-In once a Workspace domain exists.
     */
    APP_API_TOKEN?: string;
    /** Email the app token acts as. Defaults to a single-entry ACCESS_ALLOWED_EMAILS. */
    APP_API_TOKEN_EMAIL?: string;
    /** Comma-separated emails. Second layer after Google identity. Empty = identity only. */
    ACCESS_ALLOWED_EMAILS?: string;
    /**
     * Comped / owner emails: always premium, no subscription needed. The paid
     * path is the `entitlements` table written by the Stripe webhook.
     * See server/billing/plan.ts and docs/spec/billing.md.
     */
    PREMIUM_EMAILS?: string;
    /** Stripe restricted/secret key. `wrangler secret` only. */
    STRIPE_SECRET_KEY?: string;
    /** Price id of the single premium subscription (`price_...`). */
    STRIPE_PRICE_ID?: string;
    /** Signing secret of the `/api/billing/webhook` endpoint (`whsec_...`). */
    STRIPE_WEBHOOK_SECRET?: string;
    /** 32 バイト hex。未配線（フィールド暗号化スタブ用） */
    FIELD_ENCRYPTION_KEY?: string;
    /** TypeSafe Jev (System One). When set, auto-tags and AI評価 prefer Jev. */
    TYPESAFE_API_KEY?: string;
    /** Shared secret for `Authorization: Bearer` on `/mcp`. Prefer this over MCP_TOKEN. */
    MCP_API_KEY?: string;
    /** Accepted only when MCP_API_KEY is unset. */
    MCP_TOKEN?: string;
    /** Optional Brave Search API key. HTML scrapers are the fallback and often return nothing from Workers. */
    SEARCH_API_KEY?: string;
  }
}
