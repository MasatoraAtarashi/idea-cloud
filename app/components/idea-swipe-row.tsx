import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { useFetcher } from "react-router";
import { nextStage, type MockIdea } from "../data/mock";
import { useInstantPending } from "../lib/use-instant-pending";

const BUTTON_WIDTH = 88;

export function IdeaSwipeRow({ idea, children }: { idea: MockIdea; children: ReactNode }) {
  const fetcher = useFetcher();
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const next = nextStage(idea.stage);
  const canArchive = idea.stage !== "archived";
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const actionCount = Number(Boolean(next)) + Number(canArchive);
  const width = actionCount * BUTTON_WIDTH;

  function onTouchStart(event: TouchEvent) {
    if (width === 0) return;
    startX.current = event.touches[0]?.clientX ?? 0;
    startY.current = event.touches[0]?.clientY ?? 0;
    axis.current = null;
    dragging.current = false;
  }

  function onTouchMove(event: TouchEvent) {
    if (width === 0) return;
    const x = event.touches[0]?.clientX ?? startX.current;
    const y = event.touches[0]?.clientY ?? startY.current;
    const dx = startX.current - x;
    const dy = y - startY.current;
    if (!axis.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (axis.current !== "h") return;
    dragging.current = true;
    setOffset(Math.max(0, Math.min(width, dx)));
  }

  function onTouchEnd() {
    if (width === 0 || axis.current !== "h") {
      axis.current = null;
      return;
    }
    setOffset((current) => (current > BUTTON_WIDTH / 2 ? width : 0));
    axis.current = null;
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
    <div className="relative overflow-hidden md:overflow-visible">
      {width > 0 ? (
        <div className="absolute inset-y-0 right-0 flex md:hidden">
          {next ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => submitStage(next)}
              className="flex min-h-11 items-center justify-center bg-accent px-2 text-[12px] font-medium text-foreground"
              style={{ width: BUTTON_WIDTH }}
            >
              {pending ? "更新中…" : "次の段階へ"}
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => submitStage("archived")}
              className="flex min-h-11 items-center justify-center bg-[var(--danger-soft)] px-2 text-[12px] font-medium text-danger"
              style={{ width: BUTTON_WIDTH }}
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
        onTouchCancel={onTouchEnd}
        onClickCapture={(event) => {
          if (dragging.current || offset > 8) {
            event.preventDefault();
            event.stopPropagation();
            dragging.current = false;
            if (offset > 8 && offset < BUTTON_WIDTH / 2) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
