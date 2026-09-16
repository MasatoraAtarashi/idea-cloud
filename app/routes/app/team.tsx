import { PageHeader } from "../../components/shell";

export function meta() {
  return [{ title: "チーム設定 — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="チーム設定"
        description="閉じたチームの許可リスト。入り口は Google ログインです。"
      />

      <section className="ui-panel p-4">
        <h2 className="text-sm font-medium">許可リスト</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          許可したメールだけが入れます。この画面の入力はまだ無効です。
        </p>
        <textarea disabled readOnly rows={3} className="ui-input mt-3 bg-muted" />
        <p className="mt-3 text-sm text-muted-foreground">まだメンバーはいません。</p>
      </section>

      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">暗号化</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          アイデア本文は保存時に暗号化して保持する想定です。いまは未配線です。
        </p>
      </section>
    </div>
  );
}
