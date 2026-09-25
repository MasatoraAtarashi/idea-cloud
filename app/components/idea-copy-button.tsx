import { useEffect, useRef, useState } from "react";
import type { Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { formatIdeaCopyText, writeClipboard } from "../lib/idea-copy";

export function IdeaCopyButton({
  idea,
  className,
  menuitem = false,
  inline = false,
  onDone,
}: {
  idea: { title: string; body: string; stage: Stage; tags: string[]; categoryName?: string | null };
  className?: string;
  menuitem?: boolean;
  /** Toolbar button: the result replaces the label instead of a line below. */
  inline?: boolean;
  onDone?: () => void;
}) {
  const t = useT();
  const [status, setStatus] = useState<"ok" | "fail" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const ok = await writeClipboard(formatIdeaCopyText(t, idea));
    setStatus(ok ? "ok" : "fail");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus(null);
      if (ok) onDone?.();
    }, 1400);
  }

  const message = status === "ok" ? t.idea.copy.ok : status === "fail" ? t.idea.copy.fail : "";

  return (
    <div className={menuitem || inline ? "contents" : "flex flex-col gap-1"}>
      <button
        type="button"
        role={menuitem ? "menuitem" : undefined}
        onClick={() => {
          void copy();
        }}
        aria-label={t.idea.copy.aria}
        className={className ?? "ui-btn-secondary min-h-11 w-full justify-start px-3 text-[13px]"}
      >
        {(menuitem || inline) && message ? message : t.idea.copy.label}
      </button>
      {inline ? (
        <span role="status" aria-live="polite" className="sr-only">
          {message}
        </span>
      ) : null}
      {menuitem || inline ? null : (
        <p
          role="status"
          aria-live="polite"
          className={`text-[12.5px] ${status === "fail" ? "text-danger" : "text-muted-foreground"} ${message ? "" : "sr-only"}`}
        >
          {message || t.idea.copy.result}
        </p>
      )}
    </div>
  );
}
