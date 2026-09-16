import { IconUsers } from "../../components/icons";
import { PageHeader } from "../../components/ui";
import { MEMBERS, SESSION_USER } from "../../data/mock";

export function meta() {
  return [{ title: "チーム — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={<IconUsers className="h-5 w-5" />}
        title="チーム設定"
        description="本番の入り口はアプリ内 Google OAuth。許可リストが第二層です。"
      />

      <section className="ui-panel p-4">
        <h2 className="text-sm font-medium">メンバー</h2>
        {MEMBERS.length === 0 ? (
          <ul className="mt-3 divide-y divide-border">
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>
                {SESSION_USER.label}
                <span className="ml-2 text-xs text-muted-foreground">メールは未連携</span>
              </span>
              <span className="text-xs text-muted-foreground">オーナー</span>
            </li>
          </ul>
        ) : (
          <ul className="mt-3 divide-y divide-border">
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
        {MEMBERS.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            チームメイトは招待していません。名前は認証がつながってから表示します。
          </p>
        ) : null}
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
          className="ui-input mt-3 h-auto bg-muted text-muted-foreground"
          placeholder="許可メールは未設定"
          value=""
        />
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">フィールド暗号化</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          AES-GCM ヘルパは server/security/field-crypto.ts にあります。D1
          のアイデア本文への配線は未着手。鍵は FIELD_ENCRYPTION_KEY を secret にする。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">状態: 未配線</p>
      </section>
    </div>
  );
}
