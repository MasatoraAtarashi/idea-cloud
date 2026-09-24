import { useEffect, useRef, useState } from "react";
import type { Stage } from "../data/mock";
import {
  COPY_FAIL_MESSAGE,
  COPY_OK_MESSAGE,
  formatIdeaCopyText,
  writeClipboard,
} from "../lib/idea-copy";

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
  const [status, setStatus] = useState<"ok" | "fail" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const ok = await writeClipboard(formatIdeaCopyText(idea));
    setStatus(ok ? "ok" : "fail");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus(null);
      if (ok) onDone?.();
    }, 1400);
  }

  const message = status === "ok" ? COPY_OK_MESSAGE : status === "fail" ? COPY_FAIL_MESSAGE : "";

  return (
    <div className={menuitem || inline ? "contents" : "flex flex-col gap-1"}>
      <button
        type="button"
        role={menuitem ? "menuitem" : undefined}
        onClick={() => {
          void copy();
        }}
        aria-label="説明を含めてコピー"
        className={className ?? "ui-btn-secondary min-h-11 w-full justify-start px-3 text-[13px]"}
      >
        {(menuitem || inline) && message ? message : "コピー"}
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
          {message || "コピーの結果"}
        </p>
      )}
    </div>
  );
}
