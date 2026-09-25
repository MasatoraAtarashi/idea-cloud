import type { AppLoadContext } from "react-router";
import type { Locale } from "./i18n/locale";
import type { Plan } from "../server/billing/plan";

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      // Hono の ExecutionContext（最小構造）を受け取る
      ctx: {
        waitUntil: (promise: Promise<unknown>) => void;
        passThroughOnException?: () => void;
      };
    };
    /** Signed-in email from the session cookie. `null` on public pages (/login). */
    userEmail: string | null;
    /** Entitlement for the signed-in email. "free" on public pages. */
    plan: Plan;
    /** UI language: `lang` cookie, else `Accept-Language`, else Japanese. */
    locale: Locale;
  }
}

export {};
