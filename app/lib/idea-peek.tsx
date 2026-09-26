import { createContext, useCallback, useContext, useMemo, useRef, type MouseEvent } from "react";
import { useSearchParams } from "react-router";

/**
 * Quick peek. Clicking a row opens a drawer instead of leaving the list, so a
 * shelf can be flipped through; the detail page stays for the work that needs
 * room — research, brainstorm, discuss.
 *
 * The open idea lives in the URL (`?peek=<id>`) rather than in component state:
 * reloading keeps it open, the link can be sent to someone, and Back closes it,
 * which is also what the phone's back gesture does.
 */
export const PEEK_PARAM = "peek";

export function parsePeekId(params: URLSearchParams): string | null {
  const raw = params.get(PEEK_PARAM);
  return raw && raw.trim() ? raw : null;
}

/** True when two URLs differ only by which idea is peeked. */
export function isPeekOnlyChange(current: URL, next: URL): boolean {
  if (current.pathname !== next.pathname) return false;
  const a = new URLSearchParams(current.search);
  const b = new URLSearchParams(next.search);
  a.delete(PEEK_PARAM);
  b.delete(PEEK_PARAM);
  a.sort();
  b.sort();
  return a.toString() === b.toString();
}

type PeekControls = {
  peekId: string | null;
  /** `replace` while flipping, so Back leaves the list rather than each stop. */
  openPeek: (ideaId: string, options?: { replace?: boolean }) => void;
  /**
   * Step to a neighbour. Takes the ids rather than a target because a burst of
   * keypresses all read the same render: resolving against the URL inside the
   * updater means three taps move three ideas, not one.
   */
  movePeek: (orderedIds: readonly string[], delta: number) => void;
  closePeek: () => void;
};

const PeekContext = createContext<PeekControls | null>(null);

export function usePeekControls(): PeekControls {
  const [params, setParams] = useSearchParams();
  const peekId = useMemo(() => parsePeekId(params), [params]);

  /**
   * Where we are heading. A navigation has not landed by the time the next
   * keypress arrives, so a burst read from the URL alone would step once and
   * swallow the rest.
   */
  const heading = useRef<string | null>(null);
  if (heading.current !== null && heading.current === peekId) heading.current = null;

  const openPeek = useCallback(
    (ideaId: string, options?: { replace?: boolean }) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(PEEK_PARAM, ideaId);
          heading.current = ideaId;
          return next;
        },
        { preventScrollReset: true, replace: options?.replace === true },
      );
    },
    [setParams],
  );

  const movePeek = useCallback(
    (orderedIds: readonly string[], delta: number) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          const from = heading.current ?? parsePeekId(current) ?? "";
          const at = orderedIds.indexOf(from);
          const target = at < 0 ? undefined : orderedIds[at + delta];
          if (target) {
            next.set(PEEK_PARAM, target);
            heading.current = target;
          }
          return next;
        },
        { preventScrollReset: true, replace: true },
      );
    },
    [setParams],
  );

  const closePeek = useCallback(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(PEEK_PARAM);
        heading.current = null;
        return next;
      },
      { preventScrollReset: true },
    );
  }, [setParams]);

  return useMemo(
    () => ({ peekId, openPeek, movePeek, closePeek }),
    [peekId, openPeek, movePeek, closePeek],
  );
}

export function PeekProvider({
  controls,
  children,
}: {
  controls: PeekControls;
  children: React.ReactNode;
}) {
  return <PeekContext.Provider value={controls}>{children}</PeekContext.Provider>;
}

/**
 * Turns a row's existing link into a peek trigger. The `<a href>` stays, so
 * ⌘-click, middle-click and "open in new tab" still reach the detail page, and
 * anything reading the list by its links keeps working.
 */
export function usePeekLink(ideaId: string): { onClick: (event: MouseEvent) => void } | null {
  const controls = useContext(PeekContext);
  return useMemo(() => {
    if (!controls) return null;
    return {
      onClick(event: MouseEvent) {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        controls.openPeek(ideaId);
      },
    };
  }, [controls, ideaId]);
}
