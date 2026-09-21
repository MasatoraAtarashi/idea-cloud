import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AGED_DAY_PRESETS,
  allTags,
  filterIdeas,
  isReviewCandidate,
  isTriedIdea,
  STAGE_LABEL,
  STAGE_PILL_CLASS,
  STAGES,
  type MockIdea,
} from "../data/mock";
import { useCompose } from "../lib/compose";
import { formatAgedDays, formatRelativeJa, ideaExcerpt } from "../lib/format";
import { NEW_IDEA_PATH } from "../lib/home-path";
import type { ListTab, SavedViewItem } from "../lib/list-view-search";
import {
  LIST_SORT_KEYS,
  LIST_SORT_LABEL,
  listSortSummary,
  nextListSort,
  sortIdeas,
  type ListSortKey,
} from "../lib/list-sort";
import { CANDIDATE_DEFAULT_DAYS } from "../lib/review";
import { useListViewSearch } from "../lib/use-list-view-search";
import { BrandMark } from "./brand";
import { IdeaHeaderCreateButton } from "./header-create";
import { IconSearch } from "./icons";
import { IdeaActionsMenu } from "./idea-actions";
import { IdeaBoard } from "./idea-board";
import { ReflectionBadge } from "./idea-reflection";
import { IdeaReviewPrompt, ReviewStatusBadge } from "./idea-review";
import { IdeaScoreChips } from "./idea-score";
import { IdeaSwipeRow } from "./idea-swipe-row";
import { ListSavedViews } from "./list-saved-views";
import { SettingsIconLink } from "./settings-link";
import { CountBadge, StagePill, TagList } from "./ui";

const LIST_TAB_LABEL: Record<ListTab, string> = {
  all: "すべてのアイデア",
  "aging-shelf": "熟成中の棚",
  candidates: "熟成候補",
  tried: "試したアイデア",
};

const MOBILE_LIST_TAB_LABEL: Record<ListTab, string> = {
  all: "すべて",
  "aging-shelf": "熟成中",
  candidates: "熟成候補",
  tried: "試した",
};

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function IdeaListView({
  ideas,
  savedViews = [],
}: {
  ideas: MockIdea[];
  savedViews?: SavedViewItem[];
}) {
  const { open } = useCompose();
  const listState = useListViewSearch();
  const {
    tab,
    view,
    query,
    stages,
    tags,
    minDays,
    savedViewId,
    sortKey,
    sortDir,
    hrefFor,
    update,
  } = listState;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const availableTags = useMemo(() => allTags(ideas), [ideas]);
  const candidateDays = minDays > 0 ? minDays : CANDIDATE_DEFAULT_DAYS;
  const sort = { key: sortKey, dir: sortDir };
  const filtered = useMemo(() => {
    const tabbed =
      tab === "aging-shelf"
        ? ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe")
        : tab === "candidates"
          ? ideas.filter((idea) => isReviewCandidate(idea, candidateDays))
          : tab === "tried"
            ? ideas.filter((idea) => isTriedIdea(idea))
            : ideas;
    return sortIdeas(
      filterIdeas(tabbed, {
        query,
        stages,
        tags,
        minDays: tab === "candidates" ? 0 : minDays,
      }),
      sort,
    );
  }, [ideas, tab, candidateDays, query, stages, tags, minDays, sortKey, sortDir]);
  const agingCount = ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe").length;
  const candidateCount = ideas.filter((idea) => isReviewCandidate(idea, candidateDays)).length;
  const triedCount = ideas.filter((idea) => isTriedIdea(idea)).length;

  function stageFilterLabel() {
    if (stages.length === 0) return "すべて";
    return stages.map((stage) => STAGE_LABEL[stage]).join("・");
  }

  function applySort(key: ListSortKey) {
    const next = nextListSort(sort, key);
    update({ sortKey: next.key, sortDir: next.dir, savedViewId });
  }

  const tabItems = [
    ["all", null],
    ["aging-shelf", agingCount],
    ["candidates", candidateCount],
    ["tried", triedCount],
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="hidden h-[52px] shrink-0 items-center gap-3 border-b border-border px-4 md:flex">
        <h1 className="ui-title flex items-center gap-2 text-[16px]">
          アイデア
          <CountBadge value={ideas.length} />
        </h1>
        <label className="relative ml-auto hidden min-w-[12rem] max-w-sm flex-1 md:block">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => update({ query: event.target.value }, { replace: true })}
            placeholder="アイデアを検索"
            className="ui-input pl-8"
          />
        </label>
        <IdeaHeaderCreateButton />
      </header>

      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark className="h-5 w-5" />
          <span className="text-[13.5px] font-semibold text-foreground">アイデア</span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((openState) => !openState)}
            className="flex min-h-11 items-center px-2 text-[13.5px] text-foreground"
          >
            絞り込み
          </button>
          <SettingsIconLink />
          <IdeaHeaderCreateButton />
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="border-b border-border px-4 py-3 md:hidden">
          <p className="font-mono text-[11px] text-muted-foreground">並び順</p>
          <SortButtons sortKey={sortKey} sortDir={sortDir} onSort={applySort} />
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">段階</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => update({ stages: toggleValue(stages, stage) })}
                className={`stage-pill ${STAGE_PILL_CLASS[stage]} ${
                  stages.includes(stage) ? "" : "opacity-60"
                }`}
              >
                {STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
          {availableTags.length > 0 ? (
            <>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">タグ</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => update({ tags: toggleValue(tags, tag) })}
                    className={`rounded-full px-2.5 py-1 text-[12px] ${
                      tags.includes(tag)
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <div className="mt-3">
            <ListSavedViews
              views={savedViews}
              state={{ tab, view, query, stages, tags, minDays, savedViewId, sortKey, sortDir }}
              nameFieldId="saved-view-name-mobile"
            />
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">熟成日数</p>
            <AgedDaysFilter minDays={minDays} update={update} />
          </div>
        </div>
      ) : null}

      <div className="hidden h-11 shrink-0 items-center gap-4 border-b border-border px-4 md:flex">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          {tabItems.map(([item, count]) => (
            <Link
              key={item}
              to={hrefFor({
                tab: item,
                minDays: item === "candidates" && minDays === 0 ? CANDIDATE_DEFAULT_DAYS : minDays,
              })}
              preventScrollReset
              aria-current={tab === item ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 pb-2 text-[13.5px] font-semibold text-foreground no-underline ${
                tab === item ? "border-b-2 border-foreground" : ""
              }`}
            >
              {LIST_TAB_LABEL[item]}
              {count != null ? (
                <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden h-[46px] shrink-0 items-center gap-2 border-b border-border px-4 md:flex">
        <ListSavedViews
          views={savedViews}
          state={{ tab, view, query, stages, tags, minDays, savedViewId, sortKey, sortDir }}
          nameFieldId="saved-view-name-desktop"
        />
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
                  onChange={() => update({ stages: toggleValue(stages, stage) })}
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
                  onClick={() => update({ tags: toggleValue(tags, tag) })}
                  className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-row-hover"
                >
                  {tag}
                </button>
              ))}
            </div>
          </details>
        ) : null}
        <details className="ui-menu relative">
          <summary
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-control bg-card px-2.5 text-[13px]"
            aria-label="熟成日数"
          >
            <span className="text-muted-foreground">熟成日数</span>
            <span className="font-medium">{minDays > 0 ? `${minDays}日以上` : "すべて"}</span>
          </summary>
          <div className="ui-float absolute left-0 z-20 mt-1 w-48 py-1">
            <button
              type="button"
              onClick={() => update({ minDays: 0 })}
              className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-row-hover"
            >
              すべて
            </button>
            {AGED_DAY_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => update({ minDays: days })}
                className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-row-hover"
              >
                {days}日以上
              </button>
            ))}
            <form
              key={minDays}
              className="border-t border-border px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = Number(new FormData(event.currentTarget).get("minDays") ?? "");
                update({ minDays: Number.isInteger(value) && value > 0 ? value : 0 });
              }}
            >
              <label className="sr-only" htmlFor="aged-days-min">
                最小の熟成日数
              </label>
              <input
                id="aged-days-min"
                name="minDays"
                type="number"
                min={1}
                inputMode="numeric"
                defaultValue={minDays > 0 ? minDays : ""}
                placeholder="日以上"
                className="ui-input h-8 text-[13px]"
              />
            </form>
          </div>
        </details>
        <details className="ui-menu relative ml-auto">
          <summary
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-control bg-card px-2.5 text-[13px]"
            aria-label="並び順"
          >
            <span className="text-muted-foreground">並び順</span>
            <span className="font-medium">{listSortSummary(sort)}</span>
          </summary>
          <div className="ui-float absolute right-0 z-20 mt-1 w-44 py-1">
            {LIST_SORT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applySort(key)}
                className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-row-hover"
              >
                {LIST_SORT_LABEL[key]}
                {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            ))}
          </div>
        </details>
        <div className="flex rounded-md border border-border-control p-0.5">
          <Link
            to={hrefFor({ view: "table" })}
            preventScrollReset
            aria-current={view === "table" ? "page" : undefined}
            className={`rounded-sm px-2.5 py-1 text-[12.5px] no-underline ${
              view === "table" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            テーブル
          </Link>
          <Link
            to={hrefFor({ view: "board" })}
            preventScrollReset
            aria-current={view === "board" ? "page" : undefined}
            className={`rounded-sm px-2.5 py-1 text-[12.5px] no-underline ${
              view === "board" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            ボード
          </Link>
        </div>
      </div>

      <div className="border-b border-border px-4 md:hidden">
        <div className="flex gap-1 overflow-x-auto py-1">
          {tabItems.map(([item, count]) => (
            <Link
              key={item}
              to={hrefFor({
                tab: item,
                minDays: item === "candidates" && minDays === 0 ? CANDIDATE_DEFAULT_DAYS : minDays,
              })}
              preventScrollReset
              aria-current={tab === item ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] font-semibold no-underline ${
                tab === item ? "bg-foreground text-background" : "text-foreground"
              }`}
            >
              {MOBILE_LIST_TAB_LABEL[item]}
              {count != null ? <span className="font-mono text-[11px]">{count}</span> : null}
            </Link>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto md:hidden">
        {filtered.length === 0 ? (
          <ListEmpty onCreate={open} />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {filtered.map((idea) => {
              const excerpt = ideaExcerpt(idea);
              return (
                <li key={idea.id}>
                  <IdeaSwipeRow idea={idea}>
                    <div className="flex items-start gap-1 px-4 py-2">
                      <Link
                        to={`/app/ideas/${idea.id}`}
                        prefetch="intent"
                        className="min-w-0 flex-1 no-underline"
                      >
                        <p className="idea-title-wrap ui-title line-clamp-3 text-[15px] leading-snug text-foreground">
                          {idea.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <StagePill stage={idea.stage} />
                          <span
                            className={`font-mono text-[11px] ${
                              idea.agedDays > 30
                                ? "text-[var(--stage-aging-fg)]"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatAgedDays(idea.agedDays)}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatRelativeJa(idea.updatedAt)}
                          </span>
                          {idea.commentCount > 0 ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {idea.commentCount}
                            </span>
                          ) : null}
                          {idea.researchedAt || idea.researchNotes ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              調査済
                            </span>
                          ) : null}
                          <IdeaScoreChips idea={idea} />
                          <ReviewStatusBadge idea={idea} />
                          <ReflectionBadge idea={idea} />
                        </div>
                        {excerpt ? (
                          <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted-foreground">
                            {excerpt}
                          </p>
                        ) : null}
                        <div className="mt-1">
                          <TagList tags={idea.tags} />
                        </div>
                        {tab === "candidates" ? <IdeaReviewPrompt idea={idea} compact /> : null}
                      </Link>
                      <IdeaActionsMenu idea={idea} />
                    </div>
                  </IdeaSwipeRow>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
        {view === "table" ? (
          filtered.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
              <ListEmpty onCreate={open} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <SortTh
                      label="アイデア"
                      sortKey="title"
                      current={sort}
                      onSort={applySort}
                      className="min-w-0 w-[34%]"
                    />
                    <SortTh label="段階" sortKey="stage" current={sort} onSort={applySort} />
                    <th>タグ</th>
                    <th className="text-right">コメント</th>
                    <th>リサーチ</th>
                    <th>評価</th>
                    <SortTh label="更新" sortKey="updatedAt" current={sort} onSort={applySort} />
                    <SortTh label="作成" sortKey="createdAt" current={sort} onSort={applySort} />
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
                        <td className="min-w-0">
                          <Link
                            to={`/app/ideas/${idea.id}`}
                            prefetch="intent"
                            className="block min-w-0 no-underline"
                          >
                            <p className="idea-title-wrap ui-title line-clamp-2 text-[13px] leading-snug text-foreground">
                              {idea.title}
                            </p>
                            {excerpt ? (
                              <p className="mt-px line-clamp-1 text-[11.5px] leading-tight text-muted-foreground">
                                {excerpt}
                              </p>
                            ) : null}
                          </Link>
                        </td>
                        <td>
                          <StagePill stage={idea.stage} />
                        </td>
                        <td>
                          <TagList tags={idea.tags} />
                        </td>
                        <td className="text-right font-mono text-[11px] text-muted-foreground">
                          {idea.commentCount}
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground">
                          {idea.researchedAt || idea.researchNotes ? "調査済" : "未実行"}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <IdeaScoreChips idea={idea} />
                            <ReviewStatusBadge idea={idea} />
                            <ReflectionBadge idea={idea} />
                          </div>
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground">
                          {formatRelativeJa(idea.updatedAt)}
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground">
                          {formatRelativeJa(idea.createdAt)}
                        </td>
                        <td
                          className={`text-right font-mono text-[11px] ${
                            idea.agedDays > 30
                              ? "text-[var(--stage-aging-fg)]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatAgedDays(idea.agedDays)}
                        </td>
                        <td className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            {tab === "candidates" ? <IdeaReviewPrompt idea={idea} compact /> : null}
                            <IdeaActionsMenu idea={idea} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <IdeaBoard ideas={filtered} showReview={tab === "candidates"} />
        )}
      </div>
    </div>
  );
}

function SortTh({
  label,
  sortKey,
  current,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: ListSortKey;
  current: { key: ListSortKey; dir: "asc" | "desc" };
  onSort: (key: ListSortKey) => void;
  className?: string;
}) {
  const active = current.key === sortKey;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-semibold text-foreground"
      >
        {label}
        <span className="font-mono text-[11px]">
          {active ? (current.dir === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );
}

function SortButtons({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: ListSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: ListSortKey) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {LIST_SORT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSort(key)}
          className={`flex min-h-11 items-center rounded-full px-3 text-[12px] ${
            sortKey === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          }`}
        >
          {LIST_SORT_LABEL[key]}
          {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      ))}
    </div>
  );
}

function ListEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <BrandMark className="h-10 w-10 opacity-70" />
      <p className="ui-title mt-4 text-[15px]">まだアイデアがありません</p>
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

function AgedDaysFilter({
  minDays,
  update,
}: {
  minDays: number;
  update: (patch: { minDays: number }) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => update({ minDays: 0 })}
        className={`flex min-h-11 items-center rounded-full px-3 text-[12px] ${
          minDays === 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        すべて
      </button>
      {AGED_DAY_PRESETS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => update({ minDays: days })}
          className={`flex min-h-11 items-center rounded-full px-3 text-[12px] ${
            minDays === days ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          }`}
        >
          {days}日以上
        </button>
      ))}
      <form
        key={minDays}
        className="flex min-h-11 min-w-[7.5rem] flex-1 items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(new FormData(event.currentTarget).get("minDays") ?? "");
          update({ minDays: Number.isInteger(value) && value > 0 ? value : 0 });
        }}
      >
        <label className="sr-only" htmlFor="aged-days-min-mobile">
          最小の熟成日数
        </label>
        <input
          id="aged-days-min-mobile"
          name="minDays"
          type="number"
          min={1}
          inputMode="numeric"
          defaultValue={minDays > 0 ? minDays : ""}
          placeholder="日以上"
          className="ui-input"
        />
      </form>
    </div>
  );
}
