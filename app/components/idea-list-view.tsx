import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  allTags,
  filterIdeas,
  ideasByStage,
  STAGE_COLUMN_CLASS,
  STAGE_HINT,
  STAGE_LABEL,
  STAGES,
  type MockIdea,
  type Stage,
} from "../data/mock";
import { IconSearch } from "./icons";
import { IdeaActionsMenu } from "./idea-actions";
import { StagePill, TagPill } from "./ui";

type View = "table" | "board";

function StageFilters({ stages, onToggle }: { stages: Stage[]; onToggle: (stage: Stage) => void }) {
  return (
    <ul className="mt-1.5 space-y-1">
      {STAGES.map((stage) => (
        <li key={stage}>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={stages.includes(stage)}
              onChange={() => onToggle(stage)}
              className="accent-primary"
            />
            {STAGE_LABEL[stage]}
          </label>
        </li>
      ))}
    </ul>
  );
}

export function IdeaListView({ ideas }: { ideas: MockIdea[] }) {
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availableTags = allTags(ideas);
  const filtered = useMemo(
    () => filterIdeas(ideas, { query, stages, tags }),
    [ideas, query, stages, tags],
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[15px] font-medium tracking-tight">アイデア</h1>
      </div>

      <div className="mb-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="text-[13px] text-muted-foreground"
        >
          {mobileFiltersOpen ? "フィルタを閉じる" : "フィルタ"}
        </button>
        {mobileFiltersOpen ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">段階</p>
            <StageFilters stages={stages} onToggle={toggleStage} />
          </div>
        ) : null}
      </div>

      <div className="mb-3 hidden flex-wrap items-center gap-2 md:flex">
        <div className="flex rounded-md border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-sm px-2.5 py-1 text-[13px] ${
              view === "table" ? "bg-accent font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            一覧
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-sm px-2.5 py-1 text-[13px] ${
              view === "board" ? "bg-accent font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            看板
          </button>
        </div>
        <label className="relative min-w-[12rem] flex-1">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="検索"
            className="ui-input pl-8"
          />
        </label>
      </div>

      <div className="md:hidden">
        {filtered.length === 0 ? (
          <p className="border-t border-border py-8 text-[13px] text-muted-foreground">
            まだありません
          </p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {filtered.map((idea) => (
              <li key={idea.id} className="flex items-center gap-2">
                <Link to={`/app/ideas/${idea.id}`} className="min-w-0 flex-1 py-3 no-underline">
                  <p className="text-[13px] text-foreground">{idea.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{idea.agedDays}日</p>
                </Link>
                <IdeaActionsMenu idea={idea} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden md:block">
        {view === "table" ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <aside className="ui-panel w-full shrink-0 bg-card p-3.5 lg:w-56">
              <h2 className="text-[13px] font-medium">フィルタ</h2>
              <p className="mt-3 text-[11px] text-muted-foreground">段階</p>
              <StageFilters stages={stages} onToggle={toggleStage} />
              <p className="mt-3 text-[11px] text-muted-foreground">タグ</p>
              {availableTags.length === 0 ? (
                <p className="mt-1.5 text-[13px] text-muted-foreground">まだありません</p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => (
                    <li key={tag}>
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`align-middle rounded-full ${
                          tags.includes(tag) ? "ring-2 ring-ring/50" : ""
                        }`}
                      >
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
                    <th className="w-10">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center text-muted-foreground">
                        まだありません
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
                        <td className="text-right">
                          <IdeaActionsMenu idea={idea} />
                        </td>
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
                <section
                  key={stage}
                  className={`ui-panel w-56 shrink-0 p-2.5 ${STAGE_COLUMN_CLASS[stage]}`}
                >
                  <header className="mb-2 flex items-center justify-between">
                    <h2 className="text-[13px] font-medium">{STAGE_LABEL[stage]}</h2>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {cards.length}
                    </span>
                  </header>
                  <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                    {STAGE_HINT[stage]}
                  </p>
                  {cards.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-card/80 px-2 py-6 text-center text-[11px] text-muted-foreground">
                      まだありません
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {cards.map((idea) => (
                        <div
                          key={idea.id}
                          className="rounded-md border border-border bg-card p-2.5 hover:bg-row-hover"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/app/ideas/${idea.id}`}
                              className="min-w-0 flex-1 no-underline"
                            >
                              <p className="text-[13px] leading-snug text-foreground">
                                {idea.title}
                              </p>
                              <p className="mt-1.5 text-[11px] text-muted-foreground">
                                {idea.agedDays}日
                              </p>
                            </Link>
                            <IdeaActionsMenu idea={idea} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
