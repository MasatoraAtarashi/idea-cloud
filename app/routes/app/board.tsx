import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IconList, IconPlus, IconSearch } from "../../components/icons";
import { EmptyState, PageHeader, StagePill, TagPill } from "../../components/ui";
import {
  allTags,
  filterIdeas,
  IDEAS,
  ideasByStage,
  STAGE_HINT,
  STAGE_LABEL,
  STAGES,
  type Stage,
} from "../../data/mock";

export function meta() {
  return [{ title: "アイデア一覧 — アイデアクラウド" }];
}

type View = "table" | "board";

export default function IdeasPage() {
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const availableTags = allTags(IDEAS);
  const filtered = useMemo(
    () => filterIdeas(IDEAS, { query, stages, tags }),
    [query, stages, tags],
  );

  function toggleStage(stage: Stage) {
    setStages((current) =>
      current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage],
    );
  }

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  return (
    <div>
      <PageHeader
        icon={<IconList className="h-5 w-5" />}
        title="アイデア一覧"
        description="寝かせている着想の一覧です。熟していないものは開かないのが基本です。"
        action={
          <Link to="/app/capture" className="ui-btn gap-1.5">
            <IconPlus className="h-4 w-4" />
            キャプチャ
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-sm px-3 py-1 text-sm ${
              view === "table" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            一覧
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-sm px-3 py-1 text-sm ${
              view === "board" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            看板
          </button>
        </div>
        <label className="relative min-w-[12rem] flex-1">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="タイトルで検索…"
            className="ui-input pl-8"
          />
        </label>
      </div>

      {view === "table" ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <aside className="ui-panel w-full shrink-0 p-4 lg:w-60">
            <h2 className="text-sm font-medium">フィルタ</h2>
            <label className="mt-4 block text-xs text-muted-foreground" htmlFor="idea-keyword">
              フリーキーワード
            </label>
            <input
              id="idea-keyword"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="キーワード"
              className="ui-input mt-1.5"
            />
            <p className="mt-4 text-xs text-muted-foreground">段階</p>
            <ul className="mt-1.5 space-y-1">
              {STAGES.map((stage) => (
                <li key={stage}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={stages.includes(stage)}
                      onChange={() => toggleStage(stage)}
                      className="accent-primary"
                    />
                    {STAGE_LABEL[stage]}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">タグ</p>
            {availableTags.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted-foreground">タグはまだありません</p>
            ) : (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <li key={tag}>
                    <button type="button" onClick={() => toggleTag(tag)} className="align-middle">
                      <TagPill label={tag} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="ui-panel min-w-0 flex-1 overflow-x-auto">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        title="アイデアはまだありません"
                        body="キャプチャから着想を置くと、ここに並びます。"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((idea) => (
                    <tr key={idea.id}>
                      <td>
                        <Link to={`/app/ideas/${idea.id}`} className="ui-link">
                          {idea.title}
                        </Link>
                      </td>
                      <td>
                        <StagePill stage={idea.stage} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.map((tag) => (
                            <TagPill key={tag} label={tag} />
                          ))}
                        </div>
                      </td>
                      <td className="text-muted-foreground">{idea.agedDays}日</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const cards = ideasByStage(stage, filtered);
            return (
              <section key={stage} className="ui-panel w-56 shrink-0 bg-muted/80 p-2.5">
                <header className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium">{STAGE_LABEL[stage]}</h2>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {cards.length}
                  </span>
                </header>
                <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                  {STAGE_HINT[stage]}
                </p>
                {cards.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-card px-2 py-6 text-center text-[11px] text-muted-foreground">
                    カードはありません
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cards.map((idea) => (
                      <Link
                        key={idea.id}
                        to={`/app/ideas/${idea.id}`}
                        className="rounded-md border border-border bg-card p-2.5 no-underline hover:bg-muted"
                      >
                        <p className="text-sm leading-snug text-foreground">{idea.title}</p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {idea.agedDays}日
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {idea.tags.slice(0, 2).map((tag) => (
                            <TagPill key={tag} label={tag} />
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
