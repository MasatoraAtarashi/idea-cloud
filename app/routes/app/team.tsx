import { MEMBERS } from "../../data/mock";
import { PageHeader } from "../../components/shell";

export function meta() {
  return [{ title: "チーム設定 — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="チーム設定"
        description="ソロでも使えるが、既定はチーム。本番の入り口はアプリ内 Google OAuth。許可リストが第二層です。"
      />

      <section className="ui-panel overflow-hidden">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <h2 className="text-sm font-medium">メンバー</h2>
        </div>
        <table className="ui-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>メール</th>
              <th>役割</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((member) => (
              <tr key={member.email}>
                <td>{member.name}</td>
                <td className="text-muted-foreground">{member.email}</td>
                <td className="text-muted-foreground">
                  {member.role === "owner" ? "オーナー" : "メンバー"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ui-panel mt-4 overflow-hidden">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <h2 className="text-sm font-medium">Google OAuth と許可リスト</h2>
        </div>
        <div className="p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            本番の第一層はアプリ内 Google OAuth。第二層は
            ACCESS_ALLOWED_EMAILS（カンマ区切り）。値は .dev.vars / wrangler secret
            のみ。テンプレートの Access ミドルウェアは後続で外します。この画面の入力は無効です。
          </p>
          <textarea
            disabled
            rows={3}
            className="ui-input mt-3 bg-secondary text-muted-foreground"
            value="you@example.com, teammate@example.com"
          />
        </div>
      </section>

      <section className="ui-panel mt-4 overflow-hidden">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <h2 className="text-sm font-medium">フィールド暗号化</h2>
        </div>
        <div className="p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            AES-GCM ヘルパは server/security/field-crypto.ts にあります。D1
            のアイデア本文への配線は未着手。鍵は FIELD_ENCRYPTION_KEY（32 バイト hex）を secret
            にする。
          </p>
          <p className="mt-3 text-xs text-muted-foreground">状態: スタブ（未配線）</p>
        </div>
      </section>
    </div>
  );
}
