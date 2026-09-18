import { useState } from "react";
import { Link } from "react-router";
import {
  AGED_DAY_PRESETS,
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
import type { SavedViewItem } from "../lib/list-view-search";
import { useListViewSearch } from "../lib/use-list-view-search";
import { BrandMark } from "./brand";
import { IconPlus, IconSearch } from "./icons";
import { IdeaActionsMenu } from "./idea-actions";
import { IdeaScoreChips } from "./idea-score";
import { IdeaSwipeRow } from "./idea-swipe-row";
import { ListSavedViews } from "./list-saved-views";
import { CountBadge, StagePill, TagList } from "./ui";

const MOBILE_STAGES: Stage[] = ["spark", "aging", "ripe", "selected"];

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
  const { tab, view, query, stages, tags, minDays, savedViewId, hrefFor, update } = listState;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const availableTags = allTags(ideas);
  const tabbed =
    tab === "aging-shelf"
      ? ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe")
      : ideas;
  const filtered = filterIdeas(tabbed, { query, stages, tags, minDays });
  const agingCount = ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe").length;

  function stageFilterLabel() {
    if (stages.length === 0) return "すべて";
    return stages.map((stage) => STAGE_LABEL[stage]).join("・");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
          className="flex min-h-11 items-center px-2 text-[13.5px] text-muted-foreground"
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
              state={{ tab, view, query, stages, tags, minDays, savedViewId }}
              nameFieldId="saved-view-name-mobile"
            />
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">熟成日数</p>
            <AgedDaysFilter minDays={minDays} update={update} />
          </div>
        </div>
      ) : null}

      <div className="hidden h-11 shrink-0 items-center gap-4 border-b border-border px-4 md:flex">
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          <Link
            to={hrefFor({ tab: "all" })}
            preventScrollReset
            aria-current={tab === "all" ? "page" : undefined}
            className={`shrink-0 pb-2 text-[13.5px] no-underline ${
              tab === "all"
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            すべてのアイデア
          </Link>
          <Link
            to={hrefFor({ tab: "aging-shelf" })}
            preventScrollReset
            aria-current={tab === "aging-shelf" ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 pb-2 text-[13.5px] no-underline ${
              tab === "aging-shelf"
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            熟成中の棚
            <span className="font-mono text-[11px] text-muted-foreground">{agingCount}</span>
          </Link>
        </div>
      </div>

      <div className="hidden h-[46px] shrink-0 items-center gap-2 border-b border-border px-4 md:flex">
        <ListSavedViews
          views={savedViews}
          state={{ tab, view, query, stages, tags, minDays, savedViewId }}
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
          <div className="ui-float absolute left-0 z-20 mt-1 w-44 py-1">
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
          </div>
        </details>
        <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">更新順</span>
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

      <div className="px-4 pt-2 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          <Link
            to={hrefFor({ stages: [] })}
            preventScrollReset
            aria-current={stages.length === 0 ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-full px-3 text-[12.5px] font-medium no-underline ${
              stages.length === 0
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            すべて
          </Link>
          {MOBILE_STAGES.map((stage) => (
            <Link
              key={stage}
              to={hrefFor({ stages: [stage] })}
              preventScrollReset
              aria-current={stages.length === 1 && stages[0] === stage ? "page" : undefined}
              className={`stage-pill flex min-h-11 shrink-0 items-center no-underline ${STAGE_PILL_CLASS[stage]} ${
                stages.length === 1 && stages[0] === stage
                  ? "ring-1 ring-foreground/20"
                  : "opacity-80"
              }`}
            >
              {STAGE_LABEL[stage]}
            </Link>
          ))}
        </div>
        {minDays > 0 ? (
          <p className="pb-2 font-mono text-[11px] text-muted-foreground">{minDays}日以上</p>
        ) : null}
      </div>

      <div className="md:hidden">
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
                        <div className="flex flex-wrap items-center gap-2 text-[12px]">
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
                            コメント {idea.commentCount}
                          </span>
                          {idea.researchedAt || idea.researchNotes ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              調査済
                            </span>
                          ) : null}
                          <IdeaScoreChips idea={idea} />
                          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                            {formatRelativeJa(idea.updatedAt)}
                          </span>
                        </div>
                        <p className="ui-title mt-1 line-clamp-3 break-words whitespace-normal text-[13.5px] leading-snug text-foreground">
                          {idea.title}
                        </p>
                        {excerpt ? (
                          <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted-foreground">
                            {excerpt}
                          </p>
                        ) : null}
                        <div className="mt-1">
                          <TagList tags={idea.tags} />
                        </div>
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
                    <th className="text-right">コメント</th>
                    <th>リサーチ</th>
                    <th>評価</th>
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
                        <td>
                          <Link
                            to={`/app/ideas/${idea.id}`}
                            prefetch="intent"
                            className="block no-underline"
                          >
                            <p className="ui-title line-clamp-2 break-words whitespace-normal text-[13px] leading-snug text-foreground">
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
                          <IdeaScoreChips idea={idea} />
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground">
                          {formatRelativeJa(idea.updatedAt)}
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
                    <h2 className="ui-title flex items-center gap-2 text-[13.5px]">
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
                    <div className="flex flex-col gap-1.5">
                      {cards.map((idea) => (
                        <div
                          key={idea.id}
                          className="rounded-[10px] border border-border bg-card px-2.5 py-2 hover:bg-row-hover"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/app/ideas/${idea.id}`}
                              prefetch="intent"
                              className="min-w-0 flex-1 no-underline"
                            >
                              <p className="ui-title line-clamp-3 break-words whitespace-normal text-[13px] leading-snug text-foreground">
                                {idea.title}
                              </p>
                              <div className="mt-1">
                                <TagList tags={idea.tags} limit={2} />
                              </div>
                              <p className="mt-1 flex flex-wrap gap-x-2 font-mono text-[11px] text-muted-foreground">
                                <span>{formatAgedDays(idea.agedDays)}</span>
                                <span>コメント {idea.commentCount}</span>
                                {idea.researchedAt || idea.researchNotes ? (
                                  <span>調査済</span>
                                ) : null}
                                <IdeaScoreChips idea={idea} />
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
    </div>
  );
}
