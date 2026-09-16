import { Link } from "react-router";
import { IDEAS, STAGE_HINT, STAGE_LABEL, STAGES, ideasByStage } from "../../data/mock";
import { StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "熟成ボード — アイデアクラウド" }];
}

export default function BoardPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">熟成ボード</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            進捗の看板ではなく、時間を与える棚。熟していないカードは開かないのが基本です。
          </p>
        </div>
        <Link to="/app/capture" className="ui-btn">
          クイックキャプチャ
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {STAGES.map((stage) => {
          const cards = ideasByStage(stage);
          return (
            <section key={stage} className="ui-panel w-60 shrink-0 bg-muted/60 p-2.5">
              <header className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">{STAGE_LABEL[stage]}</h2>
                <span className="font-mono text-[11px] text-muted-foreground">{cards.length}</span>
              </header>
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                {STAGE_HINT[stage]}
              </p>
              <div className="flex flex-col gap-2">
                {cards.map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/app/ideas/${idea.id}`}
                    className="rounded-md border border-border bg-card p-2.5 no-underline hover:bg-muted"
                  >
                    <p className="text-sm leading-snug text-foreground">{idea.title}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{idea.agedDays}日</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {idea.tags.slice(0, 2).map((tag) => (
                        <StagePill key={tag} label={tag} />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{IDEAS.length} 件のモックカード</p>
    </div>
  );
}
