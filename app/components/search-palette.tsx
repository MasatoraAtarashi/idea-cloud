import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router";
import type { SearchResults } from "../../db/search";
import { useT } from "../i18n/context";
import { useCompose } from "../lib/compose";
import { isDesktopViewport, NEW_IDEA_PATH } from "../lib/home-path";
import {
  flattenSearchResults,
  SEARCH_KINDS,
  searchKindCounts,
  type SearchItem,
  type SearchKind,
  useSearchPalette,
} from "../lib/search-palette";
import { StageDot, TagPill } from "./ui";

const SEARCH_DEBOUNCE_MS = 120;

const GROUP_HEADING: Record<Exclude<SearchKind, "all">, string> = {
  idea: "IDEAS",
  comment: "COMMENTS",
  inspiration: "INSPIRATIONS",
  tag: "TAGS",
};

export function SearchPalette() {
  const { isOpen, close } = useSearchPalette();
  if (!isOpen) return null;
  return <SearchPaletteDialog onClose={close} />;
}

function SearchPaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const compose = useCompose();
  const t = useT();
  const fetcher = useFetcher<SearchResults>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SearchKind>("all");
  const [selected, setSelected] = useState(0);
  const openedAt = useRef(location.key);

  const trimmed = query.trim();
  const results = trimmed && fetcher.data?.query === trimmed ? fetcher.data : null;
  const counts = useMemo(() => searchKindCounts(results), [results]);
  const items = useMemo(() => flattenSearchResults(results, kind), [results, kind]);
  const loading = Boolean(trimmed) && (fetcher.state !== "idle" || !results);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on navigation (a result was opened, or the page changed underneath).
  useEffect(() => {
    if (location.key !== openedAt.current) onClose();
  }, [location.key, onClose]);

  useEffect(() => {
    if (!trimmed) return;
    const id = window.setTimeout(() => {
      void fetcher.load(`/app/search?q=${encodeURIComponent(trimmed)}`);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // fetcher identity is stable enough; re-run only on query change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  useEffect(() => {
    setSelected(0);
  }, [trimmed, kind]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function open(item: SearchItem) {
    onClose();
    navigate(item.href);
  }

  function createFromQuery() {
    const title = trimmed;
    onClose();
    if (isDesktopViewport()) {
      compose.openWithTitle(title);
      return;
    }
    navigate(title ? `${NEW_IDEA_PATH}?title=${encodeURIComponent(title)}` : NEW_IDEA_PATH);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (items.length > 0) setSelected((index) => (index + 1) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length > 0) setSelected((index) => (index - 1 + items.length) % items.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        createFromQuery();
        return;
      }
      const item = items[selected];
      if (item) open(item);
    }
  }

  let lastGroup: SearchItem["kind"] | null = null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label={t.common.close}
        className="absolute inset-0 bg-[rgba(16,24,40,0.35)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.search.label}
        className="absolute inset-x-0 top-0 flex max-h-dvh flex-col overflow-hidden bg-card shadow-[var(--shadow-float)] md:top-[12%] md:left-1/2 md:max-h-[70vh] md:w-[600px] md:max-w-[calc(100%-3rem)] md:-translate-x-1/2 md:rounded-[12px] md:border md:border-border-card"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 md:pt-4">
          <span aria-hidden="true" className="text-[15px] text-muted-foreground">
            ⌕
          </span>
          <label htmlFor="search-palette-input" className="sr-only">
            {t.nav.search.label}
          </label>
          <input
            ref={inputRef}
            id="search-palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.nav.search.placeholder}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="search-palette-results"
            aria-activedescendant={items[selected] ? `search-item-${selected}` : undefined}
            className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-foreground caret-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="ui-kbd h-6 cursor-pointer px-1.5 hover:text-foreground"
          >
            esc
          </button>
        </div>

        {trimmed ? (
          <div className="flex gap-1.5 overflow-x-auto border-b border-border px-5 py-3">
            {SEARCH_KINDS.map((item) => {
              const on = kind === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKind(item)}
                  aria-pressed={on}
                  className={`flex h-[26px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] ${
                    on
                      ? "bg-foreground font-semibold text-white"
                      : "bg-muted text-secondary hover:bg-border"
                  }`}
                >
                  {t.nav.search.kinds[item]}
                  <span className="font-mono text-[11px]">{counts[item]}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          ref={listRef}
          id="search-palette-results"
          role="listbox"
          className="min-h-0 flex-1 overflow-y-auto py-1.5"
        >
          {!trimmed ? (
            <p className="px-5 py-6 text-[13px] text-muted-foreground">{t.nav.search.hint}</p>
          ) : items.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-muted-foreground">
              {loading ? t.nav.search.loading : t.nav.search.empty(trimmed)}
            </p>
          ) : (
            items.map((item, index) => {
              const heading = item.kind !== lastGroup ? GROUP_HEADING[item.kind] : null;
              lastGroup = item.kind;
              return (
                <div key={`${item.kind}-${item.key}`}>
                  {heading ? (
                    <p className="mono-label px-5 pt-3 pb-1.5" aria-hidden="true">
                      {heading}
                    </p>
                  ) : null}
                  <SearchRow
                    item={item}
                    index={index}
                    selected={index === selected}
                    onHover={() => setSelected(index)}
                    onOpen={() => open(item)}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-sunken px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[12px] text-muted-foreground">
          <span className="hidden md:inline">{t.nav.search.moveHint}</span>
          <span className="hidden md:inline">{t.nav.search.openHint}</span>
          <button
            type="button"
            onClick={createFromQuery}
            className="ml-auto flex min-h-11 items-center gap-2 text-secondary hover:text-foreground md:min-h-0"
          >
            <kbd className="ui-kbd hidden md:inline-flex">⌘⏎</kbd>
            <span className="font-semibold text-foreground">
              {trimmed ? t.nav.search.createWith(trimmed) : t.nav.search.create}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchRow({
  item,
  index,
  selected,
  onHover,
  onOpen,
}: {
  item: SearchItem;
  index: number;
  selected: boolean;
  onHover: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      id={`search-item-${index}`}
      data-index={index}
      role="option"
      aria-selected={selected}
      onMouseMove={onHover}
      onClick={onOpen}
      className={`flex min-h-11 w-full items-center gap-2.5 px-5 py-2 text-left md:min-h-[40px] ${
        selected ? "bg-muted" : ""
      }`}
    >
      <SearchRowBody item={item} selected={selected} />
      <span
        aria-hidden="true"
        className={`w-3 shrink-0 text-right text-[11px] text-muted-foreground ${
          selected ? "" : "invisible"
        }`}
      >
        ⏎
      </span>
    </button>
  );
}

function SearchRowBody({ item, selected }: { item: SearchItem; selected: boolean }) {
  const t = useT();
  if (item.kind === "idea") {
    const idea = item.idea;
    const archived = idea.stage === "archived";
    return (
      <>
        <StageDot stage={idea.stage} />
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
          <span
            className={`truncate text-[13.5px] ${archived ? "text-muted-foreground" : "text-foreground"} ${
              selected ? "font-semibold" : ""
            }`}
          >
            {idea.title}
          </span>
          {archived ? (
            <span className="shrink-0 rounded-[5px] bg-muted px-1.5 py-px text-[11px] text-muted-foreground">
              {t.common.stage.archived}
            </span>
          ) : null}
          {idea.matchedIn ? (
            <span className="shrink-0 text-[12px] text-muted-foreground">{idea.matchedIn}</span>
          ) : (
            idea.tags.slice(0, 2).map((tag) => <TagPill key={tag} label={tag} />)
          )}
        </span>
        <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">
          {idea.agedDays}d
        </span>
      </>
    );
  }
  if (item.kind === "comment") {
    return (
      <>
        <span className="min-w-0 flex-1 truncate text-[13px] text-secondary">
          {item.comment.body}
        </span>
        <span className="max-w-[40%] shrink-0 truncate text-[12px] text-muted-foreground">
          {item.comment.ideaTitle}
        </span>
      </>
    );
  }
  if (item.kind === "inspiration") {
    const row = item.inspiration;
    return (
      <>
        <span className="h-4 w-[22px] shrink-0 overflow-hidden rounded-[3px] border border-border-card bg-muted">
          {row.ogImageUrl ? (
            <img
              src={row.ogImageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{row.title}</span>
        {row.domain ? (
          <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">
            {row.domain}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <>
      <span className="min-w-0 flex-1">
        <TagPill label={item.tag.tag} />
      </span>
      <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">
        {t.nav.search.tagCount(item.tag.count)}
      </span>
    </>
  );
}
