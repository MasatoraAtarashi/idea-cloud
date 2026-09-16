import { Link } from "react-router";

export function meta() {
  return [{ title: "ログイン — アイデアクラウド" }];
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="ui-panel w-full max-w-md p-7">
        <p className="ui-kicker">Cloudflare Access</p>
        <h1 className="mt-2 text-2xl font-semibold">ログイン</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          初期の入り口は Cloudflare Access（Zero Trust）です。アプリ内 Google OAuth
          はまだありません。いまは画面確認用のスタブです。
        </p>
        <Link to="/app" className="ui-btn mt-7 w-full py-2.5">
          続けて画面を見る（モック）
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Access 通過後の追加制限は
          <code className="mx-1 rounded-sm bg-muted px-1 py-0.5 text-[11px]">
            ACCESS_ALLOWED_EMAILS
          </code>
          。クライアントシークレットはリポジトリに置きません。
        </p>
        <div className="mt-7 flex justify-between text-sm">
          <Link to="/" className="text-muted-foreground no-underline hover:text-foreground">
            LP に戻る
          </Link>
          <Link to="/app" className="text-foreground no-underline hover:underline">
            ログインせず画面を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
