import { MEMBERS } from "../../data/mock";

export function meta() {
  return [{ title: "チーム設定 — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold">チーム設定</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        ソロでも使えるが、既定はチーム。初期の入り口は Cloudflare Access。アプリ内 Google OAuth
        は後続です。
      </p>

      <section className="ui-panel mt-6 p-4">
        <h2 className="text-sm font-medium">メンバー</h2>
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
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">Access（初期ゲート）とアプリ内 OAuth</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          いま守るのは Cloudflare Access（Zero Trust）です。アプリ内 Google OAuth
          は製品認証として後から載せます。Access 通過後の追加許可リストは
          ACCESS_ALLOWED_EMAILS。値は .dev.vars / wrangler secret のみ。この画面の入力は無効です。
        </p>
        <textarea
          disabled
          rows={3}
          className="ui-input mt-3 bg-muted text-muted-foreground"
          value="you@example.com, teammate@example.com"
        />
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">フィールド暗号化</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          AES-GCM ヘルパは server/security/field-crypto.ts にあります。D1
          のアイデア本文への配線は未着手。鍵は FIELD_ENCRYPTION_KEY（32 バイト hex）を secret
          にする。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">状態: スタブ（未配線）</p>
      </section>
    </div>
  );
}
