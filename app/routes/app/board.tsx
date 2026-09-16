import { Link } from "react-router";
import { IDEAS, STAGE_HINT, STAGE_LABEL, STAGES, ideasByStage } from "../../data/mock";
import { StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "熟成ボード — アイデアクラウド" }];
}

export default function BoardPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">熟成ボード</h1>
          <p className="mt-2 max-w-xl text-sm text-[#9a958c]">
            進捗の看板ではなく、時間を与える棚。熟していないカードは開かないのが基本です。
          </p>
        </div>
        <Link
          to="/app/capture"
          className="rounded-full bg-[#d4a574] px-4 py-2 text-sm text-[#0c0e12] no-underline"
        >
          クイックキャプチャ
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = ideasByStage(stage);
          return (
            <section
              key={stage}
              className="w-64 shrink-0 rounded-2xl border border-white/10 bg-[#10141c] p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">{STAGE_LABEL[stage]}</h2>
                <span className="text-xs text-[#9a958c]">{cards.length}</span>
              </header>
              <p className="mb-3 text-[11px] leading-relaxed text-[#9a958c]">{STAGE_HINT[stage]}</p>
              <div className="flex flex-col gap-2">
                {cards.map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/app/ideas/${idea.id}`}
                    className="rounded-xl border border-white/10 bg-[#141821] p-3 no-underline hover:border-[#d4a574]/40"
                  >
                    <p className="text-sm leading-snug text-[#e8e6e1]">{idea.title}</p>
                    <p className="mt-2 text-[11px] text-[#9a958c]">{idea.agedDays}日</p>
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
      <p className="mt-2 text-xs text-[#9a958c]">{IDEAS.length} 件のモックカード</p>
    </div>
  );
}
