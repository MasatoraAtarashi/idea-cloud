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
    <div className="min-h-screen bg-[#0c0e12]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0c0e12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-serif text-lg">アイデアクラウド</span>
          <nav className="flex items-center gap-3 text-sm">
            <a
              href="#screens"
              className="hidden text-[#9a958c] no-underline hover:text-[#e8e6e1] sm:inline"
            >
              画面マップ
            </a>
            <Link to="/login" className="text-[#e8e6e1] no-underline hover:text-[#d4a574]">
              ログイン
            </Link>
            <Link
              to="/app"
              className="rounded-full bg-[#d4a574] px-4 py-1.5 text-[#0c0e12] no-underline hover:bg-[#e0b78a]"
            >
              はじめる
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 md:pt-24">
          <p className="text-xs tracking-[0.25em] text-[#d4a574]">IDEA CLOUD</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
            アイデアは、
            <br />
            寝かせて熟す。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#9a958c] md:text-lg">
            外山滋比古『思考の整理学』に着想した、チームのためのワークスペース。思いつきはすぐに捉まえる。その場では磨かない。忘れた頃に見返し、進める・融合する・捨てる。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="rounded-full bg-[#d4a574] px-6 py-3 text-sm font-medium text-[#0c0e12] no-underline"
            >
              はじめる（画面を見る）
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-[#e8e6e1] no-underline"
            >
              ログイン
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#9a958c]">
            いまは画面認識用のモックです。Google 認証と許可リストは本番で Cloudflare Access
            に載せる想定。
          </p>
        </section>

        <section className="border-y border-white/10 bg-[#141821]">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-4">
            {[
              ["1. つかまえる", "モバイルで、整理せず置く。"],
              ["2. 寝かせる", "熟成レーンに入れ、触れない。"],
              ["3. 見返す", "熟したものだけレビューする。"],
              ["4. 進化させる", "融合し、選ばれたら調べる。"],
            ].map(([title, body]) => (
              <article key={title}>
                <h2 className="font-serif text-xl">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#9a958c]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="font-serif text-2xl">熟成の段階</h2>
          <p className="mt-2 max-w-xl text-sm text-[#9a958c]">
            看板は進捗管理ではなく、時間を与える棚です。デスクトップで俯瞰し、モバイルでは足しません。
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-5">
            {STAGES.map((stage, index) => (
              <li key={stage} className="rounded-xl border border-white/10 bg-[#141821] px-4 py-4">
                <span className="text-[11px] text-[#7eb8a8]">0{index + 1}</span>
                <p className="mt-2 font-medium">{STAGE_LABEL[stage]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="screens" className="mx-auto max-w-5xl px-4 pb-20">
          <h2 className="font-serif text-2xl">画面マップ</h2>
          <p className="mt-2 text-sm text-[#9a958c]">クリックして、主要画面の骨格を迏れます。</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APP_SCREENS.map((screen) => (
              <Link
                key={screen.path}
                to={screen.path}
                className="rounded-2xl border border-white/10 bg-[#141821] p-5 no-underline transition hover:border-[#d4a574]/40"
              >
                <h3 className="text-base font-medium text-[#e8e6e1]">{screen.title}</h3>
                <p className="mt-2 text-sm text-[#9a958c]">{screen.blurb}</p>
                <p className="mt-4 text-xs text-[#7eb8a8]">{screen.path}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#141821]">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl">モバイルは捕獲、デスクトップは判断</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9a958c]">
                外出先ではクイックキャプチャだけ。机の前で看板を開き、熟したカードを融合したり、採用したもののリサーチに進みます。ネイティブアプリは後から。まずは
                Web。
              </p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">閉じたチームから始める</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9a958c]">
                Google アカウント + 許可リスト。DB
                の本文は暗号化して保持する前提（現在はスタブ）。オペレータが平文を覚きにくい形を、最初から設計に入れます。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-[#9a958c] sm:flex-row sm:justify-between">
          <span>アイデアクラウド / Idea Cloud</span>
          <span>Masatora Atarashi · 画面認識用ファーストパス</span>
        </div>
      </footer>
    </div>
  );
}
