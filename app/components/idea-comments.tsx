import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { COMMENT_BODY_MAX, type IdeaCommentView } from "../../db/comments";
import { formatDateJa, formatRelativeJa } from "../lib/format";
import { useT } from "../i18n/context";
import { commentComposerAfterSettle, commentComposerResetOnSubmit } from "../lib/comment-composer";
import { useInstantPending } from "../lib/use-instant-pending";
import type { CommentIdeaActionData } from "../lib/idea-comment-action";
import { isSubmitShortcut } from "../lib/shortcuts";
import { shortAge } from "./ai-format";
import { IconSpinner } from "./icons";

export function isCommentSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "comment";
}

export function IdeaComments({
  comments,
  error,
  compact = false,
}: {
  comments: IdeaCommentView[];
  error?: string;
  compact?: boolean;
}) {
  const t = useT();
  const fetcher = useFetcher<CommentIdeaActionData & { ok?: true }>();
  const busy = fetcher.state !== "idle" && isCommentSubmitting(fetcher.formData);
  const { pending, hold } = useInstantPending(busy);
  const [body, setBody] = useState("");
  const [formKey, setFormKey] = useState(0);
  const lastSubmitted = useRef("");
  const resetFor = useRef<FormData | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  useEffect(() => {
    if (fetcher.state === "submitting" && isCommentSubmitting(fetcher.formData)) {
      if (resetFor.current === fetcher.formData) return;
      resetFor.current = fetcher.formData;
      const submitted = String(fetcher.formData?.get("body") ?? "");
      const next = commentComposerResetOnSubmit(
        { body: "", formKey: 0, lastSubmitted: lastSubmitted.current },
        submitted,
      );
      lastSubmitted.current = next.lastSubmitted;
      setBody(next.body);
      setFormKey((key) => key + 1);
      return;
    }
    if (fetcher.state !== "idle" || resetFor.current === undefined) return;
    const next = commentComposerAfterSettle(
      { body: "", formKey: 0, lastSubmitted: lastSubmitted.current },
      fetcher.data,
    );
    lastSubmitted.current = next.lastSubmitted;
    setBody(next.body);
    resetFor.current = undefined;
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
      textareaRef.current?.focus();
    }
  }, [fetcher.data, fetcher.formData, fetcher.state]);

  return (
    <section id="comments" className={compact ? "mt-8" : "mt-8"}>
      <h2 className="flex items-baseline gap-2 text-[13px] font-semibold">
        {t.idea.comments.heading}
        <span className="font-mono text-[12px] font-normal text-muted-foreground">
          {comments.length}
        </span>
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-muted-foreground">{t.idea.comments.empty}</p>
      ) : (
        <ol className="mt-3.5 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 h-7 w-7 shrink-0 rounded-[7px] bg-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-muted-foreground">
                  {comment.authorName} ·{" "}
                  <time dateTime={comment.createdAt} title={formatDateJa(t, comment.createdAt)}>
                    {shortAge(comment.createdAt) || formatRelativeJa(t, comment.createdAt)}
                  </time>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-[1.8] text-secondary">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <fetcher.Form
        method="post"
        className="mt-4 flex items-end gap-2 rounded-[10px] border border-border-control bg-card py-1.5 pr-1.5 pl-3.5 focus-within:border-ring"
        onSubmit={hold}
        key={formKey}
      >
        <input type="hidden" name="intent" value="comment" />
        <label htmlFor="idea-comment" className="sr-only">
          {t.idea.comments.heading}
        </label>
        <textarea
          ref={textareaRef}
          id="idea-comment"
          name="body"
          rows={1}
          maxLength={COMMENT_BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (!isSubmitShortcut(event) || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (!body.trim() || pending) return;
            event.currentTarget.form?.requestSubmit();
          }}
          placeholder={t.idea.comments.placeholder}
          readOnly={pending}
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-[36px] max-h-40 flex-1 resize-none self-center bg-transparent py-2 text-[13.5px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={pending || body.trim().length === 0}
          aria-busy={pending}
          aria-label={t.idea.comments.sendLabel}
          title={t.idea.comments.addAs(t.common.sessionUser)}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[7px] bg-muted px-3 text-[12.5px] font-semibold text-secondary hover:bg-border disabled:opacity-50 md:h-8 md:min-h-8"
        >
          {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? t.idea.comments.sending : t.idea.comments.send}
        </button>
      </fetcher.Form>
      {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
    </section>
  );
}
