import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 208;
const VIEW_MARGIN = 8;
const GAP = 4;

export type MenuPos = {
  top: number;
  left: number;
  maxHeight: number;
};

export function placeMenu(
  trigger: { top: number; right: number; bottom: number; left: number },
  viewport: { width: number; height: number },
  width = MENU_WIDTH,
  align: "start" | "end" = "end",
): MenuPos {
  let left = align === "end" ? trigger.right - width : trigger.left;
  left = Math.min(
    Math.max(VIEW_MARGIN, left),
    Math.max(VIEW_MARGIN, viewport.width - width - VIEW_MARGIN),
  );
  const spaceBelow = viewport.height - trigger.bottom - VIEW_MARGIN;
  const spaceAbove = trigger.top - VIEW_MARGIN;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(160, Math.min(360, (openUp ? spaceAbove : spaceBelow) - GAP));
  const top = openUp ? Math.max(VIEW_MARGIN, trigger.top - maxHeight - GAP) : trigger.bottom + GAP;
  return { top, left, maxHeight };
}

export function PopoverMenu({
  label,
  trigger,
  children,
  align = "end",
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0, maxHeight: 320 });
  const close = () => setOpen(false);

  function updatePlace() {
    const node = triggerRef.current;
    if (!node) return;
    setPos(
      placeMenu(
        node.getBoundingClientRect(),
        {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        MENU_WIDTH,
        align,
      ),
    );
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePlace();
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReposition() {
      updatePlace();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const content = typeof children === "function" ? children(close) : children;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-foreground hover:bg-accent md:h-7 md:w-7"
      >
        {trigger}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className="ui-float fixed z-50 overflow-y-auto overscroll-contain py-1"
              style={{
                top: pos.top,
                left: pos.left,
                maxHeight: pos.maxHeight,
                width: MENU_WIDTH,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
