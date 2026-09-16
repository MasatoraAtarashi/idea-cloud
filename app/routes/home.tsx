import { Link } from "react-router";
import { APP_SCREENS, STAGE_LABEL, STAGES } from "../data/mock";

export function meta() {
  return [
    { title: "アイデアクラウド — 寝かせて、熟す" },
    {
      name: "description",
      content: "外山滋比古『思考の整理学』に着想した、チームのためのアイデア熟成ワークスペース。",
    },
  ];
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <span className="text-sm font-semibold">アイデアクラウド</span>
          <nav className="flex items-center gap-3 text-sm">
            <a
              href="#screens"
              className="hidden text-muted-foreground no-underline hover:text-foreground sm:inline"
            >
              画面マップ
            </a>
            <Link to="/login" className="text-foreground no-underline hover:underline">
              ログイン
            </Link>
            <Link to="/app" className="ui-btn">
              はじめる
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 md:pt-16">
          <p className="ui-kicker">Idea Cloud</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            アイデアは、
            <br />
            寝かせて熟す。
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            外山滋比古『思考の整理学』に着想した、チームのためのワークスペース。思いつきはすぐに捕まえる。その場では磨かない。忘れた頃に見返し、進める・融合する・捨てる。
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link to="/app" className="ui-btn px-4 py-2">
              はじめる（画面を見る）
            </Link>
            <Link to="/login" className="ui-btn-ghost px-4 py-2">
              ログイン
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            いまは画面認識用のモックです。初期の入り口は Cloudflare Access。アプリ内 Google OAuth
            は後から載せます。
          </p>
        </section>

        <section className="border-y border-border bg-muted">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-4">
            {[
              ["1. つかまえる", "モバイルで、整理せず置く。"],
              ["2. 寝かせる", "熟成レーンに入れ、触れない。"],
              ["3. 見返す", "熟したものだけレビューする。"],
              ["4. 進化させる", "融合し、選ばれたら調べる。"],
            ].map(([title, body]) => (
              <article key={title}>
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-lg font-semibold">熟成の段階</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            看板は進捗管理ではなく、時間を与える棚です。デスクトップで俯瞻し、モバイルでは足しません。
          </p>
          <ol className="mt-6 grid gap-2 sm:grid-cols-5">
            {STAGES.map((stage, index) => (
              <li key={stage} className="ui-panel px-3 py-3">
                <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                <p className="mt-1.5 text-sm font-medium">{STAGE_LABEL[stage]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="screens" className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-lg font-semibold">画面マップ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            クリックして、主要画面の骨格を辿れます。
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {APP_SCREENS.map((screen) => (
              <Link
                key={screen.path}
                to={screen.path}
                className="ui-panel p-4 no-underline transition hover:bg-muted"
              >
                <h3 className="text-sm font-medium text-foreground">{screen.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{screen.blurb}</p>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">{screen.path}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold">モバイルは捕獲、デスクトップは判断</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                外出先ではクイックキャプチャだけ。机の前で看板を開き、熟したカードを融合したり、採用したもののリサーチに進みます。ネイティブアプリは後から。まずは
                Web。
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">閉じたチームから始める</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                いまの入り口は Cloudflare Access（Zero Trust）。アプリ内 Google OAuth
                は製品認証として後続。DB の本文は暗号化して保持する前提（現在はスタブ）。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>アイデアクラウド / Idea Cloud</span>
          <span>Masatora Atarashi · 画面認識用ファーストパス</span>
        </div>
      </footer>
    </div>
  );
}
