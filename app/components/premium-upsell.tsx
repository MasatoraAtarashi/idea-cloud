/**
 * Paywall placeholder for the AI features. Billing is not built yet, so this
 * only explains the gate — there is no checkout to link to. Once a billing SaaS
 * is wired, the CTA points at its hosted checkout. See docs/spec/billing.md.
 */
export function PremiumUpsell({ children }: { children?: string }) {
  return (
    <div className="rounded-[10px] border border-border-card bg-card px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">プレミアム限定</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {children ??
          "AI 作業台（相談・評価・リサーチ・ブレスト）と自動タグはプレミアムプランの機能です。"}
      </p>
      <p className="mt-2 font-mono text-[11.5px] text-muted-foreground">
        購入は準備中です。アイデアの作成・編集・コメントは無料で使えます。
      </p>
    </div>
  );
}
