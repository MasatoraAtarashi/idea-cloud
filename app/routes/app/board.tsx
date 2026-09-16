import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IDEAS, STAGE_HINT, STAGE_LABEL, STAGES, type Stage } from "../../data/mock";
import { EmptyState, PageHeader, StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

type View = "table" | "board";

export default function BoardPage() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [view, setView] = useState<View>("table");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return IDEAS.filter((idea) => {
      if (stage !== "all" && idea.stage !== stage) return false;
      if (!needle) return true;
      return (
        idea.title.toLowerCase().includes(needle) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [query, stage]);

  return (
    <div>
      <PageHeader
        title="アイデア"
        description="寝かせた着想を一覧する。熟していないものは開かない。"
        action={
          <Link to="/app/capture" className="ui-btn">
            キャプチャ
          </Link>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="タイトルやタグで検索"
          className="ui-input max-w-xs py-1.5"
          aria-label="アイデアを検索"
        />
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value as Stage | "all")}
          className="ui-input w-auto py-1.5"
          aria-label="段階で絞り込み"
        >
          <option value="all">すべての段階</option>
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {STAGE_LABEL[item]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex rounded-md border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-sm px-2.5 py-1 text-xs ${
              view === "table" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            テーブル
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-sm px-2.5 py-1 text-xs ${
              view === "board" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            看板
          </button>
        </div>
      </div>

      {view === "table" ? <IdeaTable ideas={filtered} /> : <AgingBoard ideas={filtered} />}
    </div>
  );
}

function IdeaTable({ ideas }: { ideas: typeof IDEAS }) {
  return (
    <div className="ui-panel overflow-x-auto">
      <table className="ui-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>段階</th>
            <th>タグ</th>
            <th>経過</th>
          </tr>
        </thead>
        <tbody>
          {ideas.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            ideas.map((idea) => (
              <tr key={idea.id}>
                <td>
                  <Link
                    to={`/app/ideas/${idea.id}`}
                    className="font-medium text-foreground no-underline hover:underline"
                  >
                    {idea.title}
                  </Link>
                </td>
                <td>
                  <StagePill label={STAGE_LABEL[idea.stage]} />
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((tag) => (
                      <StagePill key={tag} label={tag} />
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap text-muted-foreground">{idea.agedDays}日</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AgingBoard({ ideas }: { ideas: typeof IDEAS }) {
  if (ideas.length === 0) {
    return (
      <div className="ui-panel">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {STAGES.map((stage) => {
        const cards = ideas.filter((idea) => idea.stage === stage);
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
  );
}
