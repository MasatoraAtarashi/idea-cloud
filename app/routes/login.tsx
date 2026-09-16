import { Link } from "react-router";

export function meta() {
  return [{ title: "ログイン — アイデアクラウド" }];
}

/** Official four-color G mark. Visual mock only — this is not a Google SDK. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="ui-panel w-full max-w-[400px] px-8 py-10">
        <p className="text-center text-lg font-semibold tracking-tight">アイデアクラウド</p>
        <h1 className="mt-8 text-center text-[22px] font-medium">ログイン</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Google アカウントで継続します
        </p>
        {/* Mock wiring: real OAuth is a follow-up. Click-through is for screen review. */}
        <Link
          to="/app"
          className="mt-8 flex h-10 w-full items-center justify-center gap-3 rounded border border-[#747775] bg-white text-sm font-medium text-[#1f1f1f] no-underline hover:bg-[#f8f9fa]"
        >
          <GoogleMark />
          Google でログイン
        </Link>
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          画面確認用です。本番の入り口はアプリ内 Google OAuth。許可リスト（
          <code className="rounded-sm bg-muted px-1 py-0.5 text-[11px]">ACCESS_ALLOWED_EMAILS</code>
          ）が第二層です。
        </p>
        <div className="mt-8 flex justify-between text-sm">
          <Link to="/" className="text-muted-foreground no-underline hover:text-foreground">
            トップに戻る
          </Link>
          <Link to="/app" className="text-foreground no-underline hover:underline">
            ログインせず画面を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
