import { useState } from "react";
import { useT } from "../i18n/context";
import { BILLING_CHECKOUT_PATH, startBilling } from "../lib/billing";

/**
 * Paywall for the AI features. The button asks the Worker for a Stripe Checkout
 * URL and leaves; no card field is ever rendered here. When Stripe is not
 * configured the Worker answers 503 and the message says so.
 */
export function PremiumUpsell({ children }: { children?: string }) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setPending(true);
    setError(await startBilling(t, BILLING_CHECKOUT_PATH));
    setPending(false);
  }

  return (
    <div className="rounded-[10px] border border-border-card bg-card px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">{t.ai.premium.title}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {children ?? t.ai.premium.body}
      </p>
      <button type="button" onClick={upgrade} disabled={pending} className="ui-btn mt-3">
        {pending ? t.ai.premium.opening : t.ai.premium.cta}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
        {t.ai.premium.note}
      </p>
    </div>
  );
}
