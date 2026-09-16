import { EMPTY_TEAM_BODY, MEMBERS, TEAM_NAME } from "../../data/mock";
import { EmptyState, PageHeader } from "../../components/ui";

export function meta() {
  return [{ title: "チーム設定 — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="チーム設定"
        description={`${TEAM_NAME}。本番の入り口はアプリ内 Google OAuth。許可リストが第二層です。`}
      />

      <section className="ui-panel">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">メンバー</h2>
        </div>
        {MEMBERS.length === 0 ? (
          <EmptyState
            title={EMPTY_TEAM_BODY}
            body="Google ログイン後に、許可されたメールだけが並びます。"
          />
        ) : (
          <ul className="divide-y divide-border px-4">
            {MEMBERS.map((member) => (
              <li key={member.email} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  {member.name}
                  <span className="ml-2 text-xs text-muted-foreground">{member.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.role === "owner" ? "オーナー" : "メンバー"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">Google OAuth と許可リスト</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          本番の第一層はアプリ内 Google OAuth。第二層は ACCESS_ALLOWED_EMAILS（カンマ区切り）。値は
          .dev.vars / wrangler secret のみ。この画面の入力は無効です。
        </p>
        <textarea
          disabled
          rows={3}
          placeholder="you@example.com, teammate@example.com"
          className="ui-input mt-3 bg-muted text-muted-foreground"
          value=""
        />
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">フィールド暗号化</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          AES-GCM ヘルパは server/security/field-crypto.ts にあります。D1
          のアイデア本文への配線は未着手。鍵は FIELD_ENCRYPTION_KEY（32 バイト hex）を secret
          にする。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">状態: 未配線</p>
      </section>
    </div>
  );
}
