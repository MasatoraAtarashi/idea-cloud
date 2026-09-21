import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { Link } from "react-router";
import {
  clampSwipeOffset,
  SWIPE_BUTTON_WIDTH,
  swipePanelWidth,
  swipeSnapOffset,
} from "../lib/swipe";

export type SwipeRevealAction = {
  key: string;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: "default" | "danger" | "accent";
};

const TONE_CLASS: Record<NonNullable<SwipeRevealAction["tone"]>, string> = {
  default: "bg-muted text-foreground",
  accent: "bg-accent text-foreground",
  danger: "bg-[var(--danger-soft)] text-danger",
};

export function SwipeReveal({
  actions,
  children,
  buttonWidth = SWIPE_BUTTON_WIDTH,
  hideFrom = "md",
}: {
  actions: SwipeRevealAction[];
  children: ReactNode;
  buttonWidth?: number;
  hideFrom?: "md" | "lg";
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const width = swipePanelWidth(actions.length, buttonWidth);
  const hideClass = hideFrom === "lg" ? "lg:hidden" : "md:hidden";
  const overflowClass = hideFrom === "lg" ? "lg:overflow-visible" : "md:overflow-visible";

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
    setOffset(clampSwipeOffset(dx, width));
  }

  function onTouchEnd() {
    if (width === 0 || axis.current !== "h") {
      axis.current = null;
      return;
    }
    setOffset((current) => swipeSnapOffset(current, width, buttonWidth));
    axis.current = null;
  }

  function runAction(action: SwipeRevealAction) {
    if (action.disabled) return;
    action.onClick?.();
    setOffset(0);
  }

  return (
    <div className={`relative overflow-hidden ${overflowClass}`}>
      {width > 0 ? (
        <div className={`absolute inset-y-0 right-0 flex ${hideClass}`}>
          {actions.map((action) => {
            const className = [
              "flex min-h-11 shrink-0 items-center justify-center px-1 text-center text-[11px] font-medium leading-tight whitespace-nowrap",
              TONE_CLASS[action.tone ?? "default"],
            ].join(" ");
            if (action.href) {
              return (
                <Link
                  key={action.key}
                  to={action.href}
                  aria-disabled={action.disabled}
                  className={`${className} no-underline`}
                  style={{ width: buttonWidth }}
                  onClick={(event) => {
                    if (action.disabled) {
                      event.preventDefault();
                      return;
                    }
                    setOffset(0);
                  }}
                >
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={action.key}
                type="button"
                disabled={action.disabled}
                onClick={() => runAction(action)}
                className={className}
                style={{ width: buttonWidth }}
              >
                {action.label}
              </button>
            );
          })}
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
            if (offset > 8 && offset < buttonWidth / 2) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
