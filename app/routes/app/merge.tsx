import { useMemo, useState } from "react";
import { Link } from "react-router";
import { EmptyState, StagePill } from "../../components/ui";
import { IDEAS } from "../../data/mock";

export function meta() {
  return [{ title: "融合 — アイデアクラウド" }];
}

export default function MergePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [merged, setMerged] = useState<string | null>(null);

  const pool = IDEAS.filter((idea) => idea.stage !== "archived");
  const chosen = useMemo(() => IDEAS.filter((idea) => selected.includes(idea.id)), [selected]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setMerged(null);
  }

  function merge() {
    if (chosen.length < 2) return;
    const titles = chosen.map((idea) => idea.title).join(" × ");
    setMerged(`${titles} をひとつに重ねます。`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-lg font-semibold tracking-tight">融合</h1>
      {pool.length === 0 ? (
        <div className="ui-panel mt-4">
          <EmptyState title="まだありません" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_18rem]">
          <ul className="space-y-1.5">
            {pool.map((idea) => {
              const on = selected.includes(idea.id);
              return (
                <li key={idea.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(idea.id)}
                      className="mt-1 accent-primary"
                    />
                    <span>
                      <span className="block text-sm">{idea.title}</span>
                      <span className="mt-1 inline-flex items-center gap-2">
                        <StagePill stage={idea.stage} />
                        <Link
                          to={`/app/ideas/${idea.id}`}
                          className="text-[11px] text-muted-foreground no-underline hover:text-foreground"
                          onClick={(event) => event.stopPropagation()}
                        >
                          詳細
                        </Link>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <aside className="ui-panel h-fit p-4">
            <p className="text-xs text-muted-foreground">選択中 {chosen.length} 件</p>
            <button
              type="button"
              onClick={merge}
              disabled={chosen.length < 2}
              className="ui-btn mt-3 w-full"
            >
              融合する
            </button>
            {merged ? (
              <p className="mt-3 text-sm leading-relaxed text-foreground">{merged}</p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                2 件以上選ぶと、重ねた一文がここに出ます。
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
