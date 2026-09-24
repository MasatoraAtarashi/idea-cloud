import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useFetcher } from "react-router";
import {
  COMPOSE_DRAFT_HINT,
  COMPOSE_HEADING,
  COMPOSE_PLACEHOLDER,
  COMPOSE_SUBHEADING,
  COMPOSE_SUBMIT,
  COMPOSE_TAG_HINT,
  COMPOSE_TITLE_PLACEHOLDER,
  COMPOSE_URL_HINT,
  useCompose,
} from "../lib/compose";
import { NEW_IDEA_PATH } from "../lib/home-path";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { isSubmitShortcut } from "../lib/shortcuts";
import { useInstantPending } from "../lib/use-instant-pending";
import type { IdeaCategory } from "../lib/category";
import { CategoryField } from "./category-field";
import { IconClose, IconSpinner } from "./icons";

export function ComposeDialog({ categories }: { categories: IdeaCategory[] }) {
  const { isOpen, seedTitle, close } = useCompose();
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
    if (seedTitle) setTitle(seedTitle);
    const id = window.setTimeout(() => {
      document.getElementById(seedTitle ? "idea-dialog" : "idea-dialog-title")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, seedTitle]);

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

  function onSubmitShortcut(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="fixed inset-0 z-40 hidden md:block">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(16,24,40,0.35)]"
        aria-label="閉じる"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-idea-title"
        className="absolute top-[10%] left-1/2 w-[min(560px,calc(100%-3rem))] -translate-x-1/2 overflow-hidden rounded-[12px] border border-border-card bg-card shadow-[var(--shadow-float)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="new-idea-title" className="text-[15px] font-semibold text-foreground">
            {COMPOSE_HEADING}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-muted hover:text-foreground"
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
            hold();
          }}
        >
          <input type="hidden" name="stage" value="spark" />
          <div className="px-5 pt-4 pb-5">
            <p className="text-[12.5px] text-muted-foreground">{COMPOSE_SUBHEADING}</p>
            <label htmlFor="idea-dialog-title" className="sr-only">
              {COMPOSE_TITLE_PLACEHOLDER}
            </label>
            <input
              id="idea-dialog-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={onSubmitShortcut}
              autoComplete="off"
              placeholder={COMPOSE_TITLE_PLACEHOLDER}
              className="mt-3 w-full border-0 bg-transparent pb-2.5 text-[19px] leading-snug font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="h-px bg-border" />
            <label htmlFor="idea-dialog" className="sr-only">
              {COMPOSE_PLACEHOLDER}
            </label>
            <textarea
              id="idea-dialog"
              name="body"
              rows={6}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onSubmitShortcut}
              placeholder={COMPOSE_PLACEHOLDER}
              className="mt-2.5 h-auto w-full resize-none border-0 bg-transparent text-[14.5px] leading-[1.9] text-secondary outline-none placeholder:text-muted-foreground"
            />
            <p className="mt-3 text-[12.5px] font-medium text-tertiary">カテゴリ（任意）</p>
            <div className="mt-2">
              <CategoryField categories={categories} idPrefix="idea-dialog" />
            </div>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-[8px] border border-border-control bg-card px-3">
              <span className="sr-only">タグ</span>
              <input
                name="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="タグ（空なら自動タグ）"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="shrink-0 rounded-[5px] bg-[#eef4ff] px-2 py-0.5 text-[11.5px] font-medium text-[#3538cd]">
                {COMPOSE_TAG_HINT}
              </span>
            </label>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              自動タグに失敗してもアイデアは残ります。{COMPOSE_URL_HINT}
            </p>
            {fetcher.data?.error ? (
              <p className="mt-2 text-[12.5px] text-danger">{fetcher.data.error}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-sunken px-5 py-3.5">
            <p className="font-mono text-[11.5px] text-muted-foreground">{COMPOSE_DRAFT_HINT}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={close} className="ui-btn-secondary px-3">
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={pending}
                className="ui-btn px-4"
              >
                {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
                {pending ? "作成中…" : COMPOSE_SUBMIT}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
