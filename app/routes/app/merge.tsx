import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IDEAS } from "../../data/mock";
import { PageHeader } from "../../components/shell";

export function meta() {
  return [{ title: "融合 / 関連 — アイデアクラウド" }];
}

export default function MergePage() {
  const [selected, setSelected] = useState<string[]>(["i-forget-well", "i-friday-review"]);
  const [merged, setMerged] = useState<string | null>(null);

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
    setMerged(`${titles} をひとつに重ね、金曜の棚でだけ触るルールにする。`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="融合 / 関連"
        description="近い着想を重ね、新しい一枚にする（結果はモック）。Workers AI の関係抽出は未配線です。"
        actions={
          <button type="button" onClick={merge} disabled={chosen.length < 2} className="ui-btn">
            融合する（{chosen.length}）
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-[1fr_18rem]">
        <div className="ui-panel overflow-hidden">
          <table className="ui-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>アイデア</th>
                <th className="hidden sm:table-cell">詳細</th>
              </tr>
            </thead>
            <tbody>
              {IDEAS.filter((idea) => idea.stage !== "archived").map((idea) => {
                const on = selected.includes(idea.id);
                return (
                  <tr key={idea.id} className={on ? "bg-accent" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(idea.id)}
                        className="accent-primary"
                        aria-label={idea.title}
                      />
                    </td>
                    <td className="text-sm">{idea.title}</td>
                    <td className="hidden sm:table-cell">
                      <Link
                        to={`/app/ideas/${idea.id}`}
                        className="text-[11px] text-muted-foreground no-underline hover:text-foreground"
                      >
                        開く
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="ui-panel h-fit p-4">
          <p className="text-xs text-muted-foreground">選択中 {chosen.length} 件</p>
          {merged ? (
            <p className="mt-3 text-sm leading-relaxed text-foreground">{merged}</p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              2 件以上選ぶと、重ねた一文がここに出ます。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
