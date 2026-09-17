import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { COMPOSE_PLACEHOLDER, COMPOSE_SUBMIT, COMPOSE_TITLE, useCompose } from "../lib/compose";
import { NEW_IDEA_PATH } from "../lib/home-path";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { isSubmitShortcut } from "../lib/shortcuts";
import { IconClose } from "./icons";

export function ComposeDialog() {
  const { isOpen, close } = useCompose();
  const fetcher = useFetcher<CreateIdeaActionData>();
  const [draft, setDraft] = useState("");
  const submitted = useRef(false);
  const submitting = fetcher.state !== "idle";
  const canSubmit = Boolean(draft.trim()) && !submitting;

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      document.getElementById("idea-dialog")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!submitted.current || fetcher.state !== "idle") return;
    submitted.current = false;
    if (fetcher.data?.error) {
      if (fetcher.data.body) setDraft(fetcher.data.body);
      return;
    }
    setDraft("");
    close();
  }, [close, fetcher.data, fetcher.state]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 hidden md:block">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/20"
        aria-label="閉じる"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-idea-title"
        className="ui-panel absolute left-1/2 top-[12%] w-[min(36rem,calc(100%-3rem))] -translate-x-1/2 p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="new-idea-title" className="text-[15px] font-medium tracking-tight">
            {COMPOSE_TITLE}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="閉じる"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <fetcher.Form
          method="post"
          action={NEW_IDEA_PATH}
          onSubmit={() => {
            submitted.current = true;
          }}
        >
          <label htmlFor="idea-dialog" className="sr-only">
            {COMPOSE_PLACEHOLDER}
          </label>
          <textarea
            id="idea-dialog"
            name="body"
            rows={7}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={COMPOSE_PLACEHOLDER}
            className="ui-input h-auto resize-none py-2.5 text-[13px] leading-relaxed"
            onKeyDown={(event) => {
              if (!isSubmitShortcut(event)) return;
              event.preventDefault();
              if (!canSubmit) return;
              event.currentTarget.form?.requestSubmit();
            }}
          />
          {fetcher.data?.error ? (
            <p className="mt-2 text-xs text-muted-foreground">{fetcher.data.error}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">⌘Enter で作成</p>
            <button type="submit" disabled={!canSubmit} className="ui-btn h-8 px-3 text-[13px]">
              {COMPOSE_SUBMIT}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
