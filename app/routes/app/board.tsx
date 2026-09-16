import { Link } from "react-router";
import { useMemo, useState } from "react";
import { EMPTY_IDEAS_BODY, EMPTY_IDEAS_TITLE, IDEAS, STAGES, type Stage } from "../../data/mock";
import { EmptyState, PageHeader, StageChip, TagChip } from "../../components/ui";

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

export default function BoardPage() {
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Stage[]>([...STAGES]);

  function toggleStage(stage: Stage) {
    setStages((current) =>
      current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage],
    );
  }

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return IDEAS.filter((idea) => {
      if (!stages.includes(idea.stage)) return false;
      if (!needle) return true;
      return (
        idea.title.toLowerCase().includes(needle) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [query, stages]);

  return (
    <div>
      <PageHeader
        title="アイデア"
        description="寝かせた着想を、表で見返す。"
        action={
          <Link to="/app/capture" className="ui-btn">
            + キャプチャ
          </Link>
        }
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside className="ui-panel w-full shrink-0 p-4 lg:w-[260px]">
          <h2 className="text-sm font-semibold">絞り込み</h2>
          <label className="mt-4 block text-xs font-medium text-foreground" htmlFor="idea-search">
            フリーキーワード検索
          </label>
          <input
            id="idea-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="タイトルやタグ"
            className="ui-input mt-1.5"
          />
          <p className="mt-5 text-xs font-medium text-foreground">熟成の段階</p>
          <ul className="mt-2 space-y-1.5">
            {STAGES.map((stage) => {
              const on = stages.includes(stage);
              return (
                <li key={stage}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleStage(stage)}
                      className="accent-primary"
                    />
                    <StageChip stage={stage} />
                  </label>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="ui-panel min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              {rows.length === 0 ? "0 件" : `${rows.length} 件を表示`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>アイデア</th>
                  <th>段階</th>
                  <th>タグ</th>
                  <th>寝かせ</th>
                  <th>作成日</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title={EMPTY_IDEAS_TITLE} body={EMPTY_IDEAS_BODY} />
                    </td>
                  </tr>
                ) : (
                  rows.map((idea) => (
                    <tr key={idea.id}>
                      <td>
                        <Link
                          to={`/app/ideas/${idea.id}`}
                          className="font-medium text-foreground no-underline hover:underline"
                        >
                          {idea.title}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{idea.author}</p>
                      </td>
                      <td>
                        <StageChip stage={idea.stage} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.map((tag) => (
                            <TagChip key={tag} label={tag} />
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">{idea.agedDays}日</td>
                      <td className="whitespace-nowrap text-muted-foreground">{idea.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
