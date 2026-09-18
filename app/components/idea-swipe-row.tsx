import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { useFetcher } from "react-router";
import { nextStage, type MockIdea } from "../data/mock";
import { useInstantPending } from "../lib/use-instant-pending";

const REVEAL_NEXT = 152;
const REVEAL_ARCHIVE = 80;

export function IdeaSwipeRow({ idea, children }: { idea: MockIdea; children: ReactNode }) {
  const fetcher = useFetcher();
  const startX = useRef(0);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const next = nextStage(idea.stage);
  const canArchive = idea.stage !== "archived";
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const width = next && canArchive ? REVEAL_NEXT : canArchive || next ? REVEAL_ARCHIVE : 0;

  function onTouchStart(event: TouchEvent) {
    if (width === 0) return;
    startX.current = event.touches[0]?.clientX ?? 0;
    dragging.current = false;
  }

  function onTouchMove(event: TouchEvent) {
    if (width === 0) return;
    const x = event.touches[0]?.clientX ?? startX.current;
    const dx = startX.current - x;
    if (Math.abs(dx) > 8) dragging.current = true;
    setOffset(Math.max(0, Math.min(width, dx)));
  }

  function onTouchEnd() {
    if (width === 0) return;
    setOffset((current) => (current > 48 ? width : 0));
  }

  function submitStage(stage: string) {
    hold();
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", stage);
    void fetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
    setOffset(0);
  }

  return (
    <div className="relative overflow-hidden">
      {width > 0 ? (
        <div className="absolute inset-y-0 right-0 flex">
          {next ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => submitStage(next)}
              className="flex min-h-11 min-w-20 items-center justify-center bg-accent px-2 text-[12px] font-medium text-foreground"
            >
              {pending ? "更新中…" : "次の段階"}
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => submitStage("archived")}
              className="flex min-h-11 min-w-20 items-center justify-center bg-[var(--danger-soft)] px-2 text-[12px] font-medium text-danger"
            >
              {pending ? "更新中…" : "アーカイブ"}
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className="relative bg-background transition-transform duration-150 ease-out"
        style={{ transform: width > 0 ? `translateX(-${offset}px)` : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={(event) => {
          if (dragging.current || offset > 8) {
            event.preventDefault();
            event.stopPropagation();
            dragging.current = false;
            if (offset > 8 && offset < 48) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
