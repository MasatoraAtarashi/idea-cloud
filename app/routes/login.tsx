import { Link } from "react-router";

export function meta() {
  return [{ title: "ログイン — アイデアクラウド" }];
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141821] p-8">
        <p className="text-xs tracking-[0.2em] text-[#d4a574]">SECURE ACCESS</p>
        <h1 className="mt-3 font-serif text-3xl">ログイン</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9a958c]">
          本番は Cloudflare Access の Google IdP
          と、メールの許可リストで閉じます。いまは画面確認用のスタブです。
        </p>
        <Link
          to="/app"
          className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#0c0e12] no-underline"
        >
          Google でログイン（モック）
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-[#9a958c]">
          許可リスト外のアカウントは 403 を返す想定（
          <code className="text-[#7eb8a8]">ACCESS_ALLOWED_EMAILS</code>
          ）。クライアントシークレットはリポジトリに置きません。
        </p>
        <div className="mt-8 flex justify-between text-sm">
          <Link to="/" className="text-[#9a958c] no-underline hover:text-[#e8e6e1]">
            LP に戻る
          </Link>
          <Link to="/app" className="text-[#d4a574] no-underline hover:underline">
            ログインせず画面を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
