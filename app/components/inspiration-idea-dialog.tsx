import { useEffect, useState, type ReactNode } from "react";
import { useFetcher } from "react-router";
import type { IdeaCategory } from "../lib/category";
import {
  inspirationGlyph,
  inspirationHeadline,
  inspirationHostname,
  inspirationIdeaDraft,
} from "../lib/inspiration";
import {
  CREATE_IDEA_INTENT,
  INSPIRATIONS_PATH,
  type InspirationActionData,
} from "../lib/inspiration-action";
import { CategoryField } from "./category-field";
import { IconClose, IconSpinner } from "./icons";
import type { InspirationGalleryItem } from "./inspiration-gallery";
import { TagPill } from "./ui";

/** Dimmed centered card. Escape and backdrop click close. */
export function InspirationModal({
  title,
  width = 560,
  onClose,
  children,
}: {
  title: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(16,24,40,0.28)] md:items-center md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[12px] bg-card md:rounded-[12px]"
        style={{ maxWidth: width, boxShadow: "var(--shadow-float)" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-[18px] py-3.5">
          <h2 className="text-[14.5px] font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-11 w-11 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-sunken hover:text-foreground md:h-8 md:w-8"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function InspirationThumb({
  item,
  width,
  height,
}: {
  item: Pick<InspirationGalleryItem, "title" | "url" | "ogImageUrl">;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);
  if (item.ogImageUrl && !failed) {
    return (
      <img
        src={item.ogImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-[6px] border border-border object-cover"
        style={{ width, height }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-[6px] border border-border bg-muted font-mono text-[18px] text-grey-dot"
      style={{ width, height }}
    >
      {inspirationGlyph(item).toLowerCase()}
    </span>
  );
}

function fieldLabel(text: string, htmlFor?: string) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-secondary">
      {text}
    </label>
  );
}

export function InspirationIdeaDialog({
  item,
  categories,
  onClose,
}: {
  item: InspirationGalleryItem;
  categories: IdeaCategory[];
  onClose: () => void;
}) {
  const draft = inspirationIdeaDraft(item);
  const fetcher = useFetcher<InspirationActionData>();
  const [tags, setTags] = useState<string[]>(draft.tags);
  const [tagInput, setTagInput] = useState("");
  const submitting = fetcher.state !== "idle";
  const brainstorming = submitting && fetcher.formData?.get("brainstorm") === "1";
  const error = fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined;
  const host = inspirationHostname(item.url);

  function addTag(raw: string) {
    const next = raw.trim().replace(/^#/, "");
    if (!next || tags.includes(next) || tags.length >= 8) return;
    setTags([...tags, next]);
  }

  return (
    <InspirationModal title="インスピレーションからアイデアを作る" onClose={onClose}>
      <fetcher.Form
        method="post"
        action={INSPIRATIONS_PATH}
        className="flex min-h-0 flex-1 flex-col"
      >
        <input type="hidden" name="intent" value={CREATE_IDEA_INTENT} />
        <input type="hidden" name="inspirationId" value={item.id} />
        <input type="hidden" name="tags" value={tags.join("、")} />

        <div className="flex shrink-0 items-center gap-3.5 border-b border-border bg-sunken px-[18px] py-3.5">
          <InspirationThumb item={item} width={74} height={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-foreground">
              {inspirationHeadline(item)}
            </p>
            {host ? (
              <p className="mt-1 truncate font-mono text-[11.5px] text-muted-foreground">{host}</p>
            ) : null}
          </div>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="ui-btn-secondary shrink-0 px-2.5 md:h-[30px] md:min-h-[30px]"
            >
              元ネタを見る
            </a>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-[18px] py-4">
          <div>
            {fieldLabel("タイトル", "insp-idea-title")}
            <input
              id="insp-idea-title"
              name="title"
              defaultValue={draft.title}
              autoComplete="off"
              className="ui-input md:h-10 text-[14px]"
            />
          </div>
          <div>
            {fieldLabel("本文", "insp-idea-body")}
            <textarea
              id="insp-idea-body"
              name="body"
              rows={4}
              defaultValue={draft.body}
              className="ui-input h-auto min-h-[6.5rem] resize-y py-2.5 text-[13.5px] leading-[1.8]"
            />
          </div>
          <div>
            {fieldLabel("カテゴリ")}
            <CategoryField categories={categories} idPrefix="insp-idea" disabled={submitting} />
          </div>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[8px] border border-border-control px-3 py-2">
            <label htmlFor="insp-idea-tag" className="mr-1 text-[13px] text-muted-foreground">
              タグ
            </label>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                aria-label={`${tag}を外す`}
                title="外す"
              >
                <TagPill label={tag} />
              </button>
            ))}
            <input
              id="insp-idea-tag"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter" || event.key === "," || event.key === "、") {
                  event.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={() => {
                addTag(tagInput);
                setTagInput("");
              }}
              placeholder={tags.length === 0 ? "空なら自動で付きます" : ""}
              className="min-w-[5rem] flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
            {draft.tags.length > 0 ? (
              <span className="ml-auto shrink-0 rounded-[5px] bg-[#eef4ff] px-2 py-0.5 text-[11.5px] font-medium text-[#3538cd]">
                元ページから自動抽出
              </span>
            ) : null}
          </div>
          {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-card px-[18px] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="mr-auto text-[12px] text-muted-foreground">
            作成後はこのインスピが紐づきます
          </p>
          <button
            type="submit"
            name="brainstorm"
            value="1"
            disabled={submitting}
            className="ui-btn-secondary px-3.5 md:h-9 md:min-h-9"
          >
            {brainstorming ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
            {brainstorming ? "ブレスト中…" : "AIブレストしてから作る"}
          </button>
          <button type="submit" disabled={submitting} className="ui-btn px-4 md:h-9 md:min-h-9">
            {submitting && !brainstorming ? (
              <IconSpinner className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            作成
          </button>
        </footer>
      </fetcher.Form>
    </InspirationModal>
  );
}
