import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { compactAgedDays, compactRelative } from "../lib/list-format";
import { IconBack, IconClose } from "./icons";
import { IdeaScoreCard } from "./idea-evaluate";
import { ListCommentCount } from "./list-meta";
import { StagePill, TagList } from "./ui";

/**
 * Right-hand drawer for skimming a shelf: stage, body, tags and the AI score,
 * with ↑/↓ to move to the neighbouring idea without closing. Everything shown
 * is already in the list payload, so opening one costs no round trip.
 */
export function IdeaPeekDrawer({
  idea,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  idea: MockIdea;
  /** 1-based, within the list as currently filtered and sorted. */
  index: number;
  total: number;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
}) {
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
    // Focus is handed back by the list once the rows have re-rendered; see
    // `IdeaListView`. Doing it here would race React replacing the row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new idea starts at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [idea.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const target = event.target;
      // Never steal a keystroke meant for something the reader is typing in.
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowDown" || event.key === "j") {
        if (!onNext) return;
        event.preventDefault();
        onNext();
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        if (!onPrev) return;
        event.preventDefault();
        onPrev();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNext, onPrev]);

  const body = idea.body.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(16,24,40,0.28)] sm:items-stretch sm:justify-end"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={idea.title}
        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[14px] bg-card outline-none sm:max-h-none sm:h-full sm:w-[min(460px,100%)] sm:rounded-none sm:border-l sm:border-border"
        style={{ boxShadow: "var(--shadow-float)" }}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-3.5 py-2.5">
          <span className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t.list.peek.heading}
          </span>
          <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">
            {t.list.peek.position(index, total)}
          </span>
          <span className="flex items-center">
            <button
              type="button"
              onClick={() => onPrev?.()}
              disabled={!onPrev}
              aria-label={t.list.peek.prev}
              title={`${t.list.peek.prev} (↑)`}
              className="flex h-8 w-8 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-sunken hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <IconBack className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => onNext?.()}
              disabled={!onNext}
              aria-label={t.list.peek.next}
              title={`${t.list.peek.next} (↓)`}
              className="flex h-8 w-8 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-sunken hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <IconBack className="h-4 w-4 -rotate-90" />
            </button>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-sunken hover:text-foreground"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StagePill stage={idea.stage} />
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {compactAgedDays(t, idea.agedDays)}
            </span>
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {compactRelative(t, idea.updatedAt)}
            </span>
            <ListCommentCount count={idea.commentCount} />
          </div>

          <h2 className="ui-title mt-3 text-[18px] leading-snug tracking-[-0.01em]">
            {idea.title}
          </h2>

          {body && body !== idea.title ? (
            <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-[1.8] text-secondary">
              {body}
            </p>
          ) : (
            <p className="mt-2.5 text-[13px] text-muted-foreground">{t.list.peek.noBody}</p>
          )}

          {idea.tags.length > 0 ? (
            <div className="mt-3">
              <TagList tags={idea.tags} />
            </div>
          ) : null}

          <div className="mt-4">
            {/* Posting from the list would hit the board's action, so aim it. */}
            <IdeaScoreCard idea={idea} action={`/app/ideas/${idea.id}`} />
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-3 border-t border-border px-[18px] py-3">
          <Link to={`/app/ideas/${idea.id}`} prefetch="intent" className="ui-btn no-underline">
            {t.list.peek.openDetail}
          </Link>
          <p className="min-w-0 text-[11.5px] leading-snug text-muted-foreground">
            {t.list.peek.detailHint}
          </p>
          <span className="ml-auto hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
            {t.list.peek.keyHint}
          </span>
        </footer>
      </div>
    </div>
  );
}
