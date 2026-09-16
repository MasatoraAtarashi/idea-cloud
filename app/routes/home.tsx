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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-4">
          <span className="text-sm font-semibold">アイデアクラウド</span>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/login" className="ui-btn-ghost h-8 px-3">
              ログイン
            </Link>
            <Link to="/app" className="ui-btn h-8 px-3">
              はじめる
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="ui-kicker">Idea Cloud</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          アイデアは、寝かせて熟す。
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          外山滋比古『思考の整理学』に着想した、チームのためのワークスペース。思いつきはすぐに捕まえる。その場では磨かない。忘れた頃に見返し、進める・融合する・捨てる。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          いまは画面認識用のモックです。本番の入り口はアプリ内 Google
          OAuth。許可リストが第二層です。
        </p>

        <section className="ui-panel mt-8 overflow-hidden">
          <div className="border-b border-border bg-secondary px-4 py-2.5">
            <h2 className="text-sm font-medium">画面</h2>
          </div>
          <table className="ui-table">
            <thead>
              <tr>
                <th>名前</th>
                <th className="hidden sm:table-cell">説明</th>
                <th>パス</th>
              </tr>
            </thead>
            <tbody>
              {APP_SCREENS.map((screen) => (
                <tr key={screen.path} className="hover:bg-accent">
                  <td>
                    <Link to={screen.path} className="font-medium text-foreground no-underline">
                      {screen.title}
                    </Link>
                  </td>
                  <td className="hidden text-muted-foreground sm:table-cell">{screen.blurb}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">{screen.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="ui-panel mt-4 overflow-hidden">
          <div className="border-b border-border bg-secondary px-4 py-2.5">
            <h2 className="text-sm font-medium">熟成の段階</h2>
          </div>
          <table className="ui-table">
            <thead>
              <tr>
                <th className="w-16">#</th>
                <th>レーン</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((stage, index) => (
                <tr key={stage}>
                  <td className="font-mono text-[11px] text-muted-foreground">0{index + 1}</td>
                  <td>{STAGE_LABEL[stage]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
