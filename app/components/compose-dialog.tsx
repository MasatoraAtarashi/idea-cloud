import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import {
  COMPOSE_DRAFT_HINT,
  COMPOSE_PLACEHOLDER,
  COMPOSE_SUBMIT,
  COMPOSE_TITLE,
  COMPOSE_TITLE_PLACEHOLDER,
  COMPOSE_URL_HINT,
  useCompose,
} from "../lib/compose";
import { NEW_IDEA_PATH } from "../lib/home-path";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { isSubmitShortcut } from "../lib/shortcuts";
import { useInstantPending } from "../lib/use-instant-pending";
import { SESSION_USER } from "../data/mock";
import { IconClose, IconSpinner } from "./icons";
import { StageSelect } from "./stage-select";

export function ComposeDialog() {
  const { isOpen, close } = useCompose();
  const fetcher = useFetcher<CreateIdeaActionData>();
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [tags, setTags] = useState("");
  const submitted = useRef(false);
  const submitting = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(submitting);
  const canSubmit = Boolean((title.trim() || draft.trim()) && !pending);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      document.getElementById("idea-dialog-title")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!submitted.current || fetcher.state !== "idle") return;
    submitted.current = false;
    if (fetcher.data?.error) {
      setTitle(fetcher.data.title ?? "");
      if (fetcher.data.body) setDraft(fetcher.data.body);
      return;
    }
    setTitle("");
    setDraft("");
    setTags("");
    close();
  }, [close, fetcher.data, fetcher.state]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 hidden md:block">
      <button
        type="button"
        className="absolute inset-0 bg-[#15181d]/35"
        aria-label="閉じる"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-idea-title"
        className="ui-float absolute left-1/2 top-[10%] w-[min(42rem,calc(100%-3rem))] -translate-x-1/2"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="stage-pill stage-spark">{COMPOSE_TITLE}</span>
            <h2 id="new-idea-title" className="text-[12.5px] text-muted-foreground">
              新しいアイデア
            </h2>
          </div>
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
          className="px-5 pb-4 pt-4"
          onSubmit={() => {
            submitted.current = true;
            hold();
          }}
        >
          <label htmlFor="idea-dialog-title" className="sr-only">
            {COMPOSE_TITLE_PLACEHOLDER}
          </label>
          <input
            id="idea-dialog-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={COMPOSE_TITLE_PLACEHOLDER}
            className="ui-title w-full border-0 bg-transparent text-[23px] leading-[1.4] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <label htmlFor="idea-dialog" className="sr-only">
            {COMPOSE_PLACEHOLDER}
          </label>
          <textarea
            id="idea-dialog"
            name="body"
            rows={6}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={COMPOSE_PLACEHOLDER}
            className="mt-2 h-auto w-full resize-none border-0 bg-transparent text-[13.5px] leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/80"
            onKeyDown={(event) => {
              if (!isSubmitShortcut(event)) return;
              event.preventDefault();
              if (!canSubmit) return;
              event.currentTarget.form?.requestSubmit();
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              name="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="空なら自動タグ"
              className="h-8 w-40 rounded-full border border-dashed border-border-control bg-transparent px-3 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <StageSelect defaultValue="spark" />
            <span className="inline-flex h-8 items-center rounded-full border border-border-control px-2.5 text-[12.5px] text-muted-foreground">
              {SESSION_USER.label}
            </span>
            <p className="basis-full text-[11.5px] text-muted-foreground">
              タグを空のまま作成すると、短い日本語タグを自動で付けます。失敗してもアイデアは残ります。
              {COMPOSE_URL_HINT}
            </p>
          </div>
          {fetcher.data?.error ? (
            <p className="mt-2 text-xs text-muted-foreground">{fetcher.data.error}</p>
          ) : null}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-[12.5px] text-muted-foreground">{COMPOSE_DRAFT_HINT}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={close} className="ui-btn-secondary h-8 px-3">
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={pending}
                className="ui-btn h-8 px-3 text-[13.5px]"
              >
                {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
                {pending ? "作成中" : COMPOSE_SUBMIT}
                <kbd className="ml-1 rounded bg-white/20 px-1 font-mono text-[10px] text-primary-foreground">
                  ⌘↵
                </kbd>
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
