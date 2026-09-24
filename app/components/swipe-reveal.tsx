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
  tone?: "default" | "danger" | "accent" | "primary";
};

const TONE_CLASS: Record<NonNullable<SwipeRevealAction["tone"]>, string> = {
  default: "bg-muted text-foreground",
  accent: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
  danger: "bg-[var(--danger-soft)] text-danger",
};

/**
 * Swipe left reveals `actions` on the right edge. Swipe right reveals `leadingActions`
 * on the left edge. Offset is signed: positive = content moved left.
 */
export function SwipeReveal({
  actions,
  leadingActions = [],
  children,
  buttonWidth = SWIPE_BUTTON_WIDTH,
  hideFrom = "md",
  actionClassName = "",
}: {
  actions: SwipeRevealAction[];
  leadingActions?: SwipeRevealAction[];
  children: ReactNode;
  buttonWidth?: number;
  hideFrom?: "md" | "lg";
  actionClassName?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const width = swipePanelWidth(actions.length, buttonWidth);
  const leadWidth = swipePanelWidth(leadingActions.length, buttonWidth);
  const enabled = width > 0 || leadWidth > 0;
  const hideClass = hideFrom === "lg" ? "lg:hidden" : "md:hidden";
  const overflowClass = hideFrom === "lg" ? "lg:overflow-visible" : "md:overflow-visible";

  function onTouchStart(event: TouchEvent) {
    if (!enabled) return;
    startX.current = event.touches[0]?.clientX ?? 0;
    startY.current = event.touches[0]?.clientY ?? 0;
    startOffset.current = offset;
    axis.current = null;
    dragging.current = false;
  }

  function onTouchMove(event: TouchEvent) {
    if (!enabled) return;
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
    const next = startOffset.current + dx;
    setOffset(next >= 0 ? clampSwipeOffset(next, width) : -clampSwipeOffset(-next, leadWidth));
  }

  function onTouchEnd() {
    if (!enabled || axis.current !== "h") {
      axis.current = null;
      return;
    }
    setOffset((current) =>
      current >= 0
        ? swipeSnapOffset(current, width, buttonWidth)
        : -swipeSnapOffset(-current, leadWidth, buttonWidth),
    );
    axis.current = null;
  }

  function runAction(action: SwipeRevealAction) {
    if (action.disabled) return;
    action.onClick?.();
    setOffset(0);
  }

  function renderAction(action: SwipeRevealAction) {
    const className = [
      "flex min-h-11 shrink-0 items-center justify-center px-1 text-center text-[12px] font-semibold leading-tight whitespace-nowrap",
      TONE_CLASS[action.tone ?? "default"],
      actionClassName,
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
  }

  return (
    <div className={`relative overflow-hidden ${overflowClass}`}>
      {leadWidth > 0 && offset < 0 ? (
        <div className={`absolute inset-y-0 left-0 flex ${hideClass}`}>
          {leadingActions.map(renderAction)}
        </div>
      ) : null}
      {width > 0 && offset > 0 ? (
        <div className={`absolute inset-y-0 right-0 flex ${hideClass}`}>
          {actions.map(renderAction)}
        </div>
      ) : null}
      <div
        className="relative bg-card transition-transform duration-150 ease-out"
        style={{ transform: enabled && offset !== 0 ? `translateX(${-offset}px)` : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={(event) => {
          if (dragging.current || Math.abs(offset) > 8) {
            event.preventDefault();
            event.stopPropagation();
            dragging.current = false;
            if (Math.abs(offset) > 8 && Math.abs(offset) < buttonWidth / 2) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
