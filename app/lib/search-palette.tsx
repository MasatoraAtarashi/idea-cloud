import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SearchResults } from "../../db/search";

type SearchPaletteValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SearchPaletteContext = createContext<SearchPaletteValue | null>(null);

export function SearchPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <SearchPaletteContext.Provider value={value}>{children}</SearchPaletteContext.Provider>;
}

export function useSearchPalette(): SearchPaletteValue {
  const value = useContext(SearchPaletteContext);
  if (!value) throw new Error("useSearchPalette must be used within SearchPaletteProvider");
  return value;
}

/** ⌘K / Ctrl+K. */
export function isSearchShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === "k"
  );
}

export const SEARCH_KINDS = ["all", "idea", "comment", "inspiration", "tag"] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchItem =
  | { kind: "idea"; key: string; href: string; idea: SearchResults["ideas"][number] }
  | { kind: "comment"; key: string; href: string; comment: SearchResults["comments"][number] }
  | {
      kind: "inspiration";
      key: string;
      href: string;
      inspiration: SearchResults["inspirations"][number];
    }
  | { kind: "tag"; key: string; href: string; tag: SearchResults["tags"][number] };

export function searchKindCounts(results: SearchResults | null): Record<SearchKind, number> {
  const idea = results?.ideas.length ?? 0;
  const comment = results?.comments.length ?? 0;
  const inspiration = results?.inspirations.length ?? 0;
  const tag = results?.tags.length ?? 0;
  return { all: idea + comment + inspiration + tag, idea, comment, inspiration, tag };
}

/** Grouped rows in display order; ↑↓ walks this list. */
export function flattenSearchResults(
  results: SearchResults | null,
  kind: SearchKind = "all",
): SearchItem[] {
  if (!results) return [];
  const items: SearchItem[] = [];
  const want = (value: SearchKind) => kind === "all" || kind === value;
  if (want("idea")) {
    for (const idea of results.ideas) {
      items.push({ kind: "idea", key: idea.id, href: `/app/ideas/${idea.id}`, idea });
    }
  }
  if (want("comment")) {
    for (const comment of results.comments) {
      items.push({
        kind: "comment",
        key: String(comment.id),
        href: `/app/ideas/${comment.ideaId}#comments`,
        comment,
      });
    }
  }
  if (want("inspiration")) {
    for (const inspiration of results.inspirations) {
      items.push({
        kind: "inspiration",
        key: inspiration.id,
        href: `/app/inspirations/${inspiration.id}`,
        inspiration,
      });
    }
  }
  if (want("tag")) {
    for (const tag of results.tags) {
      items.push({
        kind: "tag",
        key: tag.tag,
        href: `/app/list?tag=${encodeURIComponent(tag.tag)}`,
        tag,
      });
    }
  }
  return items;
}
