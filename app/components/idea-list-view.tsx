import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  AGED_DAY_PRESETS,
  allTags,
  filterIdeas,
  isReviewCandidate,
  isTriedIdea,
  STAGE_PILL_CLASS,
  STAGES,
  type MockIdea,
  type Stage,
} from "../data/mock";
import { useT } from "../i18n/context";
import { useCompose } from "../lib/compose";
import { ideaExcerpt } from "../lib/format";
import { NEW_IDEA_PATH } from "../lib/home-path";
import { compactAgedDays, compactRelative, LIST_GROUP_ORDER } from "../lib/list-format";
import type { ListTab, ListViewSearch, SavedViewItem } from "../lib/list-view-search";
import { LIST_SORT_KEYS, nextListSort, sortIdeas, type ListSortKey } from "../lib/list-sort";
import { CANDIDATE_DEFAULT_DAYS } from "../lib/review";
import { PeekProvider, usePeekControls, usePeekLink } from "../lib/idea-peek";
import { useSearchPalette } from "../lib/search-palette";
import { useListViewSearch } from "../lib/use-list-view-search";
import type { IdeaCategory } from "../lib/category";
import { BrandMark } from "./brand";
import { IdeaHeaderCreateButton } from "./header-create";
import { MobileScreenHeader } from "./mobile-header";
import { IdeaActionsMenu } from "./idea-actions";
import { IdeaBoard } from "./idea-board";
import { IdeaPeekDrawer } from "./idea-peek-drawer";
import { IdeaReviewPrompt } from "./idea-review";
import { IdeaSwipeRow } from "./idea-swipe-row";
import { ListAiScore, ListCommentCount } from "./list-meta";
import { ListSavedViews } from "./list-saved-views";
import { StagePill, TagList } from "./ui";

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

type Update = ReturnType<typeof useListViewSearch>["update"];

export function IdeaListView({
  ideas,
  savedViews = [],
  categories = [],
}: {
  ideas: MockIdea[];
  savedViews?: SavedViewItem[];
  categories?: IdeaCategory[];
}) {
  const t = useT();
  const { open } = useCompose();
  const search = useSearchPalette();
  const listState = useListViewSearch();
  const {
    tab,
    view,
    query,
    stages,
    tags,
    minDays,
    categoryId,
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
        categoryId,
      }),
      sort,
    );
  }, [ideas, tab, candidateDays, query, stages, tags, minDays, categoryId, sortKey, sortDir]);
  const groups = useMemo(
    () =>
      LIST_GROUP_ORDER.map((stage) => ({
        stage,
        ideas: filtered.filter((idea) => idea.stage === stage),
      })).filter((group) => group.ideas.length > 0),
    [filtered],
  );
  /**
   * List order, once. The table groups by stage, so `filtered` (sorted, not
   * grouped) is not what the reader sees — walking that with ↑/↓ would jump
   * between groups. `LIST_GROUP_ORDER` covers every stage, so this is a
   * reordering of `filtered`, never a smaller set.
   */
  const ordered = useMemo(() => groups.flatMap((group) => group.ideas), [groups]);

  const peek = usePeekControls();
  const peekIndex = peek.peekId ? ordered.findIndex((idea) => idea.id === peek.peekId) : -1;
  const peeked = peekIndex >= 0 ? ordered[peekIndex] : null;
  const orderedIds = useMemo(() => ordered.map((idea) => idea.id), [ordered]);

  /**
   * Hand focus back to the row before the drawer goes, so a keyboard reader
   * lands where they were rather than at the top of the page. Done here, while
   * the row is still the element it was, rather than hunting for it afterwards.
   */
  const closePeek = useCallback(() => {
    const open = peek.peekId;
    if (open) {
      for (const row of document.querySelectorAll<HTMLElement>(
        `a[href="/app/ideas/${CSS.escape(open)}"]`,
      )) {
        if (row.offsetParent !== null) {
          row.focus();
          break;
        }
      }
    }
    peek.closePeek();
  }, [peek]);

  const stepPeek = useCallback(
    (delta: number) => peek.movePeek(orderedIds, delta),
    [orderedIds, peek],
  );

  const agingCount = ideas.filter((idea) => idea.stage === "aging" || idea.stage === "ripe").length;
  const candidateCount = ideas.filter((idea) => isReviewCandidate(idea, candidateDays)).length;
  const triedCount = ideas.filter((idea) => isTriedIdea(idea)).length;
  const activeFilterCount =
    stages.length +
    tags.length +
    (categoryId != null ? 1 : 0) +
    (minDays > 0 && tab !== "candidates" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function applySort(key: ListSortKey) {
    const next = nextListSort(sort, key);
    update({ sortKey: next.key, sortDir: next.dir, savedViewId });
  }

  const tabItems = [
    ["all", ideas.length],
    ["aging-shelf", agingCount],
    ["candidates", candidateCount],
    ["tried", triedCount],
  ] as const;

  function tabHref(item: ListTab) {
    return hrefFor({
      tab: item,
      minDays: item === "candidates" && minDays === 0 ? CANDIDATE_DEFAULT_DAYS : minDays,
    });
  }

  const savedViewState: ListViewSearch = {
    tab,
    view,
    query,
    stages,
    tags,
    minDays,
    categoryId,
    savedViewId,
    sortKey,
    sortDir,
  };

  return (
    <PeekProvider controls={peek}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="hidden shrink-0 items-center gap-3 border-b border-border bg-card px-7 pt-5 pb-4 md:flex">
          <h1 className="flex items-baseline gap-2.5 text-[20px] font-semibold tracking-[-0.01em] text-foreground">
            {t.list.title}
            <span className="font-mono text-[12px] font-normal tracking-normal text-muted-foreground">
              {t.list.count(ideas.length)}
            </span>
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-8 overflow-hidden rounded-[7px] border border-border-control bg-card">
              {(
                [
                  ["table", t.list.layout.table],
                  ["board", t.list.layout.board],
                ] as const
              ).map(([item, label]) => (
                <Link
                  key={item}
                  to={hrefFor({ view: item })}
                  preventScrollReset
                  aria-current={view === item ? "page" : undefined}
                  className={`flex items-center px-3 text-[12.5px] font-semibold no-underline ${
                    view === item
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <IdeaHeaderCreateButton />
          </div>
        </header>

        <nav
          className="hidden shrink-0 items-center gap-[22px] border-b border-border bg-card px-7 md:flex"
          aria-label={t.list.tabsLabel}
        >
          {tabItems.map(([item, count]) => (
            <Link
              key={item}
              to={tabHref(item)}
              preventScrollReset
              aria-current={tab === item ? "page" : undefined}
              className={`-mb-px flex items-baseline gap-1.5 border-b-2 py-3 text-[13.5px] no-underline ${
                tab === item
                  ? "border-foreground font-semibold text-foreground"
                  : "border-transparent text-tertiary hover:text-foreground"
              }`}
            >
              {t.list.tab[item]}
              <span className="font-mono text-[11.5px] font-normal text-muted-foreground">
                {count}
              </span>
            </Link>
          ))}
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                update({ query: "", stages: [], tags: [], categoryId: null, minDays: 0 })
              }
              className="ml-auto text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              {t.list.clearFilters}
              <span className="ml-1 font-mono text-[11px]">{activeFilterCount}</span>
            </button>
          ) : null}
        </nav>

        <MobileScreenHeader
          title={<h1 className="text-[18px] font-semibold text-foreground">{t.list.title}</h1>}
          trailing={
            <>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((openState) => !openState)}
                aria-expanded={mobileFiltersOpen}
                className="flex min-h-11 items-center px-2 text-[13px] font-medium text-tertiary"
              >
                {t.list.filters}
                {activeFilterCount > 0 ? (
                  <span className="ml-1 font-mono text-[11px]">{activeFilterCount}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={search.open}
                aria-label={t.list.search}
                className="flex h-11 w-11 items-center justify-center text-[18px] text-tertiary"
              >
                ⌕
              </button>
              <IdeaHeaderCreateButton />
            </>
          }
        >
          <nav className="flex gap-5 overflow-x-auto px-4" aria-label={t.list.tabsLabel}>
            {tabItems.map(([item, count]) => (
              <Link
                key={item}
                to={tabHref(item)}
                preventScrollReset
                aria-current={tab === item ? "page" : undefined}
                className={`-mb-px flex min-h-11 shrink-0 items-center gap-1 border-b-2 text-[14px] no-underline ${
                  tab === item
                    ? "border-foreground font-semibold text-foreground"
                    : "border-transparent text-tertiary"
                }`}
              >
                {t.list.tabShort[item]}
                {item === "candidates" && count > 0 ? (
                  <span className="font-mono text-[13px] text-warn">{count}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </MobileScreenHeader>

        {mobileFiltersOpen ? (
          <div className="max-h-[60dvh] overflow-y-auto border-b border-border bg-card md:hidden">
            <FilterPanel
              query={query}
              stages={stages}
              tags={tags}
              minDays={minDays}
              categoryId={categoryId}
              categories={categories}
              availableTags={availableTags}
              update={update}
              mobile
            />
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-[11.5px] font-semibold text-muted-foreground">
                {t.list.sortOrder}
              </p>
              <SortButtons sortKey={sortKey} sortDir={sortDir} onSort={applySort} />
              <p className="mt-3 mb-2 text-[11.5px] font-semibold text-muted-foreground">
                {t.list.savedViews.label}
              </p>
              <ListSavedViews
                views={savedViews}
                state={savedViewState}
                nameFieldId="saved-view-name-mobile"
              />
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 md:hidden">
          {candidateCount > 0 && tab !== "candidates" ? (
            <Link
              to={tabHref("candidates")}
              className="mb-3 flex min-h-11 items-center justify-between rounded-[10px] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3.5 text-[13px] text-warn no-underline"
            >
              <span>{t.list.candidateBanner(candidateCount)}</span>
              <span className="font-semibold">{t.list.candidateBannerAction}</span>
            </Link>
          ) : null}
          {filtered.length === 0 ? (
            <ListEmpty onCreate={open} />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filtered.map((idea) => (
                <li key={idea.id}>
                  <IdeaSwipeRow idea={idea}>
                    <MobileIdeaCard idea={idea} showReview={tab === "candidates"} />
                  </IdeaSwipeRow>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
          {view === "table" ? (
            filtered.length === 0 && activeFilterCount === 0 ? (
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
                <ListEmpty onCreate={open} />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-[22px]">
                <div className="rounded-[var(--radius)] border border-border-card bg-card">
                  <ListTableHead
                    sort={sort}
                    onSort={applySort}
                    query={query}
                    stages={stages}
                    tags={tags}
                    minDays={tab === "candidates" ? 0 : minDays}
                    categoryId={categoryId}
                    categories={categories}
                    availableTags={availableTags}
                    update={update}
                  />
                  {groups.map((group) => (
                    <StageGroup key={group.stage} stage={group.stage} ideas={group.ideas} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <IdeaBoard ideas={filtered} showReview={tab === "candidates"} />
          )}
        </div>
      </div>
      {peeked ? (
        <IdeaPeekDrawer
          idea={peeked}
          index={peekIndex + 1}
          total={ordered.length}
          onPrev={peekIndex > 0 ? () => stepPeek(-1) : null}
          onNext={peekIndex < ordered.length - 1 ? () => stepPeek(1) : null}
          onClose={closePeek}
        />
      ) : null}
    </PeekProvider>
  );
}

/**
 * Columns shared by the header row and idea rows. The meta columns are sized
 * for the longest header any locale ships, not just the Japanese one — at 48px
 * the last column clipped English "Updated".
 */
const TABLE_GRID =
  "grid grid-cols-[116px_minmax(0,1fr)_190px_48px_56px_52px_72px_24px] items-center gap-x-3.5 px-[18px]";

function StageGroup({ stage, ideas }: { stage: Stage; ideas: MockIdea[] }) {
  const t = useT();
  return (
    <section aria-label={t.common.stage[stage]} className="border-b border-border last:border-b-0">
      <h2 className="flex items-baseline gap-2.5 border-b border-border bg-[var(--row-soft)] px-[18px] py-2">
        <span className="text-[13px] font-semibold text-foreground">{t.common.stage[stage]}</span>
        <span className="font-mono text-[12px] text-muted-foreground">{ideas.length}</span>
        <span className="text-[12px] text-muted-foreground">{t.list.groupHint[stage]}</span>
      </h2>
      <ul>
        {ideas.map((idea) => (
          <IdeaRow key={idea.id} idea={idea} />
        ))}
      </ul>
    </section>
  );
}

/** One 40px line: pill | title + excerpt | tags | meta. The whole row opens the detail. */
function IdeaRow({ idea }: { idea: MockIdea }) {
  const t = useT();
  const peek = usePeekLink(idea.id);
  const excerpt = ideaExcerpt(idea) || (idea.body.trim() !== idea.title ? idea.body.trim() : "");
  return (
    <li
      className={`relative min-h-10 border-b border-border py-2 last:border-b-0 hover:bg-row-hover ${TABLE_GRID}`}
    >
      <div>
        <StagePill stage={idea.stage} />
      </div>
      <Link
        to={`/app/ideas/${idea.id}`}
        prefetch="intent"
        {...peek}
        className="flex min-w-0 items-baseline gap-2.5 overflow-hidden whitespace-nowrap no-underline after:absolute after:inset-0 after:content-['']"
      >
        <span className="max-w-full shrink-0 truncate text-[15.5px] leading-[1.5] font-semibold tracking-[-0.01em] text-foreground">
          {idea.title}
        </span>
        {excerpt ? (
          <span className="min-w-0 truncate text-[12.5px] text-muted-foreground">{excerpt}</span>
        ) : null}
      </Link>
      <div className="min-w-0">
        <TagList tags={idea.tags} nowrap />
      </div>
      <div className="flex justify-end">
        <ListAiScore score={idea.aiScore} />
      </div>
      <div className="flex justify-end">
        <ListCommentCount count={idea.commentCount} />
      </div>
      <span
        className="text-right font-mono text-[11.5px] text-muted-foreground"
        title={t.list.agedDays}
      >
        {compactAgedDays(t, idea.agedDays)}
      </span>
      <span
        className="text-right font-mono text-[11.5px] text-muted-foreground"
        title={t.list.column.updated}
      >
        {compactRelative(t, idea.updatedAt)}
      </span>
      <span className="relative z-[1] -mr-1.5 flex justify-end">
        <IdeaActionsMenu idea={idea} />
      </span>
    </li>
  );
}

type ListSortState = { key: ListSortKey; dir: "asc" | "desc" };

/** Sticky column header: click a label to sort, ▾ to filter that column. */
function ListTableHead({
  sort,
  onSort,
  query,
  stages,
  tags,
  minDays,
  categoryId,
  categories,
  availableTags,
  update,
}: {
  sort: ListSortState;
  onSort: (key: ListSortKey) => void;
  query: string;
  stages: Stage[];
  tags: string[];
  minDays: number;
  categoryId: number | null;
  categories: IdeaCategory[];
  availableTags: string[];
  update: Update;
}) {
  const t = useT();
  return (
    <div
      role="row"
      className={`sticky top-0 z-10 h-[34px] rounded-t-[var(--radius)] border-b border-border bg-card text-[11.5px] font-semibold text-muted-foreground ${TABLE_GRID}`}
    >
      <HeadCell
        label={t.list.column.stage}
        sortKey="stage"
        sort={sort}
        onSort={onSort}
        active={stages.length}
        filter={
          <FilterSection label={t.list.column.stage}>
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => update({ stages: toggleValue(stages, stage) })}
                aria-pressed={stages.includes(stage)}
                className={`stage-pill ${STAGE_PILL_CLASS[stage]} ${
                  stages.includes(stage) ? "ring-1 ring-foreground" : "opacity-70 hover:opacity-100"
                }`}
              >
                {t.common.stage[stage]}
              </button>
            ))}
          </FilterSection>
        }
      />
      <HeadCell
        label={t.list.column.idea}
        sortKey="title"
        sort={sort}
        onSort={onSort}
        active={(query.trim() ? 1 : 0) + (categoryId != null ? 1 : 0)}
        filter={
          <>
            <label className="block">
              <span className="sr-only">{t.list.keyword}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => update({ query: event.target.value }, { replace: true })}
                placeholder={t.list.keywordPlaceholderShort}
                className="ui-input text-[12.5px] md:h-8"
              />
            </label>
            {categories.length > 0 ? (
              <FilterSection label={t.list.category}>
                <button
                  type="button"
                  onClick={() => update({ categoryId: null })}
                  className={chipClass(categoryId == null)}
                >
                  {t.list.allOption}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      update({ categoryId: categoryId === category.id ? null : category.id })
                    }
                    className={chipClass(categoryId === category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </FilterSection>
            ) : null}
          </>
        }
      />
      <HeadCell
        label={t.list.column.tags}
        active={tags.length}
        filter={
          availableTags.length > 0 ? (
            <FilterSection label={t.list.column.tags}>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => update({ tags: toggleValue(tags, tag) })}
                  aria-pressed={tags.includes(tag)}
                  className={chipClass(tags.includes(tag))}
                >
                  {tag}
                </button>
              ))}
            </FilterSection>
          ) : (
            <p className="text-[12px] text-muted-foreground">{t.list.noTags}</p>
          )
        }
      />
      <span className="text-right" title={t.list.aiScoreFull}>
        {t.list.column.aiScore}
      </span>
      <span className="text-right">{t.list.column.comments}</span>
      <HeadCell
        label={t.list.column.aged}
        sortKey="createdAt"
        sort={sort}
        onSort={onSort}
        align="right"
        active={minDays > 0 ? 1 : 0}
        filter={
          <FilterSection label={t.list.agedDays}>
            <button
              type="button"
              onClick={() => update({ minDays: 0 })}
              className={chipClass(minDays === 0)}
            >
              {t.list.allOption}
            </button>
            {AGED_DAY_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => update({ minDays: days })}
                className={chipClass(minDays === days)}
              >
                {t.list.agedDaysAtLeast(days)}
              </button>
            ))}
          </FilterSection>
        }
      />
      <HeadCell
        label={t.list.column.updated}
        sortKey="updatedAt"
        sort={sort}
        onSort={onSort}
        align="right"
      />
      <span />
    </div>
  );
}

function HeadCell({
  label,
  sortKey,
  sort,
  onSort,
  filter,
  active = 0,
  align = "left",
}: {
  label: string;
  sortKey?: ListSortKey;
  sort?: ListSortState;
  onSort?: (key: ListSortKey) => void;
  filter?: ReactNode;
  active?: number;
  align?: "left" | "right";
}) {
  const t = useT();
  const sorted = sortKey && sort?.key === sortKey;
  // The aged column sorts by created_at: newest-created = least aged.
  const arrow = !sorted
    ? ""
    : sortKey === "createdAt"
      ? sort?.dir === "asc"
        ? "↓"
        : "↑"
      : sort?.dir === "asc"
        ? "↑"
        : "↓";
  return (
    <div
      role="columnheader"
      aria-sort={sorted ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
      className={`flex min-w-0 items-center gap-0.5 ${align === "right" ? "justify-end" : ""}`}
    >
      {sortKey && onSort ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          title={t.list.sortByLabel(label)}
          className={`flex items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 -ml-1 hover:bg-sunken hover:text-foreground ${
            sorted ? "text-foreground" : ""
          }`}
        >
          {label}
          <span className="w-2 font-mono text-[11px]">{arrow}</span>
        </button>
      ) : (
        <span className="whitespace-nowrap">{label}</span>
      )}
      {filter ? (
        <details className="ui-menu relative">
          <summary
            aria-label={t.list.filterByLabel(label)}
            title={t.list.filterByLabel(label)}
            className={`flex h-5 min-w-5 cursor-pointer items-center justify-center gap-0.5 rounded px-1 hover:bg-sunken hover:text-foreground ${
              active > 0 ? "bg-muted text-foreground" : ""
            }`}
          >
            <span className="text-[9px]">▾</span>
            {active > 0 ? <span className="font-mono text-[10.5px]">{active}</span> : null}
          </summary>
          <div
            className={`ui-float absolute z-20 mt-1.5 flex w-72 flex-col gap-3 px-3.5 py-3 font-normal ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {filter}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function MobileIdeaCard({ idea, showReview }: { idea: MockIdea; showReview: boolean }) {
  const t = useT();
  const peek = usePeekLink(idea.id);
  const excerpt = ideaExcerpt(idea) || (idea.body.trim() !== idea.title ? idea.body.trim() : "");
  return (
    <Link
      to={`/app/ideas/${idea.id}`}
      prefetch="intent"
      {...peek}
      className="block rounded-[10px] border border-border-card bg-card px-[15px] py-[14px] no-underline"
    >
      <div className="flex items-center gap-2">
        <StagePill stage={idea.stage} />
        <span className="font-mono text-[12px] text-muted-foreground">
          {compactAgedDays(t, idea.agedDays)}
        </span>
        <span className="ml-auto">
          <ListAiScore score={idea.aiScore} />
        </span>
      </div>
      <p className="idea-title-wrap ui-title mt-2 line-clamp-3 text-[15.5px] leading-[1.55] text-foreground">
        {idea.title}
      </p>
      {excerpt ? (
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.7] text-muted-foreground">
          {excerpt}
        </p>
      ) : null}
      {showReview ? <IdeaReviewPrompt idea={idea} compact /> : null}
    </Link>
  );
}

function chipClass(on: boolean) {
  return `flex min-h-11 items-center rounded-full border px-3 text-[12.5px] md:min-h-7 ${
    on
      ? "border-foreground bg-foreground text-primary-foreground"
      : "border-border-control bg-card text-secondary hover:bg-sunken"
  }`;
}

function FilterPanel({
  query,
  stages,
  tags,
  minDays,
  categoryId,
  categories,
  availableTags,
  update,
  mobile = false,
}: {
  query: string;
  stages: Stage[];
  tags: string[];
  minDays: number;
  categoryId: number | null;
  categories: IdeaCategory[];
  availableTags: string[];
  update: Update;
  mobile?: boolean;
}) {
  const t = useT();
  const pad = mobile ? "px-4" : "px-3.5";
  return (
    <div className={`flex flex-col gap-3 py-3 ${pad}`}>
      <label className="block">
        <span className="sr-only">{t.list.keyword}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => update({ query: event.target.value }, { replace: true })}
          placeholder={t.list.keywordPlaceholder}
          className="ui-input"
        />
      </label>
      <FilterSection label={t.list.column.stage}>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => update({ stages: toggleValue(stages, stage) })}
            aria-pressed={stages.includes(stage)}
            className={`stage-pill ${STAGE_PILL_CLASS[stage]} ${
              stages.includes(stage) ? "ring-1 ring-foreground" : "opacity-70 hover:opacity-100"
            } ${mobile ? "min-h-9" : ""}`}
          >
            {t.common.stage[stage]}
          </button>
        ))}
      </FilterSection>
      {categories.length > 0 ? (
        <FilterSection label={t.list.category}>
          <button
            type="button"
            onClick={() => update({ categoryId: null })}
            className={chipClass(categoryId == null)}
          >
            {t.list.allOption}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                update({ categoryId: categoryId === category.id ? null : category.id })
              }
              className={chipClass(categoryId === category.id)}
            >
              {category.name}
            </button>
          ))}
        </FilterSection>
      ) : null}
      {availableTags.length > 0 ? (
        <FilterSection label={t.list.column.tags}>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => update({ tags: toggleValue(tags, tag) })}
              aria-pressed={tags.includes(tag)}
              className={chipClass(tags.includes(tag))}
            >
              {tag}
            </button>
          ))}
        </FilterSection>
      ) : null}
      <FilterSection label={t.list.agedDays}>
        <button
          type="button"
          onClick={() => update({ minDays: 0 })}
          className={chipClass(minDays === 0)}
        >
          {t.list.allOption}
        </button>
        {AGED_DAY_PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => update({ minDays: days })}
            className={chipClass(minDays === days)}
          >
            {t.list.agedDaysAtLeast(days)}
          </button>
        ))}
        <form
          key={minDays}
          className="w-24"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(new FormData(event.currentTarget).get("minDays") ?? "");
            update({ minDays: Number.isInteger(value) && value > 0 ? value : 0 });
          }}
        >
          <label className="sr-only" htmlFor={mobile ? "aged-days-min-mobile" : "aged-days-min"}>
            {t.list.agedDaysMin}
          </label>
          <input
            id={mobile ? "aged-days-min-mobile" : "aged-days-min"}
            name="minDays"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={minDays > 0 ? minDays : ""}
            placeholder={t.list.agedDaysMinPlaceholder}
            className="ui-input md:h-7 text-[12.5px]"
          />
        </form>
      </FilterSection>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11.5px] font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
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
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {LIST_SORT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSort(key)}
          className={chipClass(sortKey === key)}
        >
          {t.list.sort.key[key]}
          {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      ))}
    </div>
  );
}

function ListEmpty({ onCreate }: { onCreate: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:py-20">
      <BrandMark className="h-10 w-10 opacity-70" />
      <p className="ui-title mt-4 text-[16px]">{t.list.empty.title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {t.list.empty.body}
      </p>
      <Link to={NEW_IDEA_PATH} className="ui-btn-secondary mt-5 md:hidden">
        {t.list.empty.create}
      </Link>
      <button
        type="button"
        onClick={onCreate}
        className="ui-btn-secondary mt-5 hidden md:inline-flex"
      >
        {t.list.empty.create}
        <kbd className="ui-kbd ml-1.5">⌘N</kbd>
      </button>
    </div>
  );
}
