import { MEMBERS } from "../../data/mock";

export function meta() {
  return [{ title: "チーム設定 — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl">チーム設定</h1>
      <p className="mt-2 text-sm text-[#9a958c]">
        ソロでも使えるが、既定はチーム。認証は Google、入場は許可リスト。
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#141821] p-5">
        <h2 className="text-sm font-medium">メンバー</h2>
        <ul className="mt-4 divide-y divide-white/10">
          {MEMBERS.map((member) => (
            <li key={member.email} className="flex items-center justify-between py-3 text-sm">
              <span>
                {member.name}
                <span className="ml-2 text-xs text-[#9a958c]">{member.email}</span>
              </span>
              <span className="text-xs text-[#d4a574]">
                {member.role === "owner" ? "オーナー" : "メンバー"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#141821] p-5">
        <h2 className="text-sm font-medium">Google 認証 + 許可リスト</h2>
        <p className="mt-2 text-xs leading-relaxed text-[#9a958c]">
          本番は Cloudflare Access（Google IdP）で入り口を閉じ、アプリは ACCESS_ALLOWED_EMAILS
          で二重に見る。値は .dev.vars / wrangler secret のみ。この画面の入力は無効です。
        </p>
        <textarea
          disabled
          rows={3}
          className="mt-4 w-full rounded-xl border border-white/10 bg-[#0c0e12] px-3 py-2 text-sm text-[#9a958c]"
          value="you@example.com, teammate@example.com"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#141821] p-5">
        <h2 className="text-sm font-medium">フィールド暗号化</h2>
        <p className="mt-2 text-xs leading-relaxed text-[#9a958c]">
          AES-GCM ヘルパは server/security/field-crypto.ts にあります。D1
          のアイデア本文への配線は未着手。鍵は FIELD_ENCRYPTION_KEY（32 バイト hex）を secret
          にする。
        </p>
        <p className="mt-4 text-xs text-[#7eb8a8]">状態: スタブ（未配線）</p>
      </section>
    </div>
  );
}
