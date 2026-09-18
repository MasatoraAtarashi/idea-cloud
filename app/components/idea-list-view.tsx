import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  allTags,
  filterIdeas,
  ideasByStage,
  STAGE_HINT,
  STAGE_LABEL,
  STAGE_PILL_CLASS,
  STAGES,
  type MockIdea,
  type Stage,
} from "../data/mock";
import { useCompose } from "../lib/compose";
import { formatAgedDays, formatRelativeJa, ideaExcerpt } from "../lib/format";
import { NEW_IDEA_PATH } from "../lib/home-path";
import { BrandMark } from "./brand";
import { IconPlus, IconSearch } from "./icons";
import { IdeaActionsMenu } from "./idea-actions";
import { CountBadge, StagePill, TagPill } from "./ui";

type View = "table" | "board";
type ListTab = "all" | "aging-shelf";

const MOBILE_STAGES: Stage[] = ["spark", "aging", "ripe", "selected"];

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function IdeaListView({ ideas }: { ideas: MockIdea[] }) {
  const { open } = useCompose();
  const [view, setView] = useState<View>("table");
  const [tab, setTab] = useState<ListTab>("all");
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availableTags = allTags(ideas);
  const tabbed = useMemo(() => {
    if (tab === "aging-shelf") {
      return ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe");
    }
    return ideas;
  }, [ideas, tab]);
  const filtered = useMemo(
    () => filterIdeas(tabbed, { query, stages, tags }),
    [tabbed, query, stages, tags],
  );
  const agingCount = ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe").length;

  function stageFilterLabel() {
    if (stages.length === 0) return "すべて";
    return stages.map((stage) => STAGE_LABEL[stage]).join("・");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
        <h1 className="flex items-center gap-2 text-[16px] font-medium tracking-tight">
          アイデア
          <CountBadge value={ideas.length} />
        </h1>
        <label className="relative ml-auto hidden min-w-[12rem] max-w-sm flex-1 md:block">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="アイデアを検索"
            className="ui-input pl-8"
          />
        </label>
        <button type="button" onClick={open} className="ui-btn hidden md:inline-flex">
          <IconPlus className="h-3.5 w-3.5" />
          新規アイデア
        </button>
      </header>

      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border px-4 md:hidden">
        <div className="flex items-center gap-2">
          <BrandMark className="h-5 w-5" />
          <span className="text-[13.5px] font-medium">アイデア</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((openState) => !openState)}
          className="text-[13.5px] text-muted-foreground"
        >
          絞り込み
        </button>
      </div>

      {mobileFiltersOpen ? (
        <div className="border-b border-border px-4 py-3 md:hidden">
          <p className="font-mono text-[11px] text-muted-foreground">段階</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setStages((current) => toggleValue(current, stage))}
                className={`stage-pill ${STAGE_PILL_CLASS[stage]} ${
                  stages.includes(stage) ? "" : "opacity-60"
                }`}
              >
                {STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="hidden h-11 shrink-0 items-center gap-3 border-b border-border px-4 md:flex">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`shrink-0 pb-2 text-[13.5px] ${
              tab === "all"
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            すべてのアイデア
          </button>
          <button
            type="button"
            onClick={() => setTab("aging-shelf")}
            className={`flex shrink-0 items-center gap-1.5 pb-2 text-[13.5px] ${
              tab === "aging-shelf"
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            熟成中の棚
            <span className="font-mono text-[11px] text-muted-foreground">{agingCount}</span>
          </button>
        </div>
      </div>

      <div className="hidden h-[46px] shrink-0 items-center gap-2 border-b border-border px-4 md:flex">
        <details className="ui-menu relative">
          <summary
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-control bg-card px-2.5 text-[13px]"
            aria-label="フィルタ"
          >
            <span className="text-muted-foreground">段階</span>
            <span className="font-medium">{stageFilterLabel()}</span>
          </summary>
          <div className="ui-float absolute left-0 z-20 mt-1 w-44 py-1">
            {STAGES.map((stage) => (
              <label
                key={stage}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-row-hover"
              >
                <input
                  type="checkbox"
                  checked={stages.includes(stage)}
                  onChange={() => setStages((current) => toggleValue(current, stage))}
                  className="accent-primary"
                />
                {STAGE_LABEL[stage]}
              </label>
            ))}
          </div>
        </details>
        {availableTags.length > 0 ? (
          <details className="ui-menu relative">
            <summary className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-control bg-card px-2.5 text-[13px]">
              <span className="text-muted-foreground">タグ</span>
              <span className="font-medium">{tags.length === 0 ? "すべて" : tags.join("・")}</span>
            </summary>
            <div className="ui-float absolute left-0 z-20 mt-1 w-44 py-1">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags((current) => toggleValue(current, tag))}
                  className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-row-hover"
                >
                  {tag}
                </button>
              ))}
            </div>
          </details>
        ) : null}
        <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">更新順</span>
        <div className="flex rounded-md border border-border-control p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-sm px-2.5 py-1 text-[12.5px] ${
              view === "table" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            テーブル
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-sm px-2.5 py-1 text-[12.5px] ${
              view === "board" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            ボード
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setStages([])}
            className={`shrink-0 rounded-full px-3 py-1 text-[12.5px] font-medium ${
              stages.length === 0
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            すべて
          </button>
          {MOBILE_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStages([stage])}
              className={`stage-pill shrink-0 ${STAGE_PILL_CLASS[stage]} ${
                stages.length === 1 && stages[0] === stage
                  ? "ring-1 ring-foreground/20"
                  : "opacity-80"
              }`}
            >
              {STAGE_LABEL[stage]}
            </button>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        {filtered.length === 0 ? (
          <ListEmpty onCreate={open} />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {filtered.map((idea) => {
              const excerpt = ideaExcerpt(idea);
              return (
                <li key={idea.id} className="px-4 py-3">
                  <Link to={`/app/ideas/${idea.id}`} className="block no-underline">
                    <div className="flex items-center gap-2 text-[12px]">
                      <StagePill stage={idea.stage} />
                      <span
                        className={`font-mono text-[11.5px] ${
                          idea.agedDays > 30
                            ? "text-[var(--stage-aging-fg)]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatAgedDays(idea.agedDays)}
                      </span>
                      <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">
                        {formatRelativeJa(idea.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] font-medium leading-snug text-foreground">
                      {idea.title}
                    </p>
                    {excerpt ? (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
                        {excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden min-h-0 flex-1 md:block">
        {view === "table" ? (
          filtered.length === 0 ? (
            <div className="flex min-h-[28rem] items-center justify-center">
              <ListEmpty onCreate={open} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>アイデア</th>
                    <th>段階</th>
                    <th>タグ</th>
                    <th>更新</th>
                    <th className="text-right">熟成日数</th>
                    <th className="w-10">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((idea) => {
                    const excerpt = ideaExcerpt(idea);
                    return (
                      <tr key={idea.id}>
                        <td className="py-2.5">
                          <Link to={`/app/ideas/${idea.id}`} className="block no-underline">
                            <p className="text-[13.5px] font-medium text-foreground">
                              {idea.title}
                            </p>
                            {excerpt ? (
                              <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">
                                {excerpt}
                              </p>
                            ) : null}
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
                        <td className="font-mono text-[11.5px] text-muted-foreground">
                          {formatRelativeJa(idea.createdAt)}
                        </td>
                        <td
                          className={`text-right font-mono text-[11.5px] ${
                            idea.agedDays > 30
                              ? "text-[var(--stage-aging-fg)]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatAgedDays(idea.agedDays)}
                        </td>
                        <td className="text-right">
                          <IdeaActionsMenu idea={idea} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="flex gap-3 overflow-x-auto p-4">
            {STAGES.map((stage) => {
              const cards = ideasByStage(stage, filtered);
              return (
                <section key={stage} className="w-64 shrink-0">
                  <header className="mb-2 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[13.5px] font-medium">
                      <StagePill stage={stage} />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {cards.length}
                      </span>
                    </h2>
                  </header>
                  <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                    {STAGE_HINT[stage]}
                  </p>
                  {cards.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-2 py-6 text-center text-[11px] text-muted-foreground">
                      まだありません
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {cards.map((idea) => (
                        <div
                          key={idea.id}
                          className="rounded-[10px] border border-border bg-card p-3 hover:bg-row-hover"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/app/ideas/${idea.id}`}
                              className="min-w-0 flex-1 no-underline"
                            >
                              <p className="text-[13.5px] font-medium leading-snug text-foreground">
                                {idea.title}
                              </p>
                              <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                                {formatAgedDays(idea.agedDays)}
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

function ListEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <BrandMark className="h-10 w-10 opacity-70" />
      <p className="mt-4 text-[15px] font-medium">まだアイデアがありません</p>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        思いついた時点の粗さを残します。預けて寝かせ、熟した頃に見返します。
      </p>
      <Link to={NEW_IDEA_PATH} className="ui-btn-secondary mt-5 md:hidden">
        最初のアイデアを作成
      </Link>
      <button
        type="button"
        onClick={onCreate}
        className="ui-btn-secondary mt-5 hidden md:inline-flex"
      >
        最初のアイデアを作成
        <kbd className="ui-kbd ml-1.5">⌘N</kbd>
      </button>
    </div>
  );
}
