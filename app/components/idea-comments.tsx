import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { COMMENT_BODY_MAX, type IdeaCommentView } from "../../db/comments";
import { formatDateJa, formatRelativeJa } from "../lib/format";
import { SESSION_USER } from "../data/mock";
import { useInstantPending } from "../lib/use-instant-pending";
import type { CommentIdeaActionData } from "../lib/idea-comment-action";
import { IconSpinner } from "./icons";

export function isCommentSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "comment";
}

function commentSucceeded(data: (CommentIdeaActionData & { ok?: true }) | undefined) {
  return Boolean(data && "ok" in data && data.ok);
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
  const fetcher = useFetcher<CommentIdeaActionData & { ok?: true }>();
  const busy = fetcher.state !== "idle" && isCommentSubmitting(fetcher.formData);
  const { pending, hold } = useInstantPending(busy);
  const [body, setBody] = useState("");
  const [formKey, setFormKey] = useState(0);
  const submittedBody = useRef("");
  const lastSuccess = useRef<(CommentIdeaActionData & { ok?: true }) | undefined>(undefined);
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  useEffect(() => {
    if (fetcher.state === "submitting" && isCommentSubmitting(fetcher.formData)) {
      submittedBody.current = String(fetcher.formData?.get("body") ?? "");
      setBody("");
    }
  }, [fetcher.state, fetcher.formData]);

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (commentSucceeded(fetcher.data)) {
      if (lastSuccess.current !== fetcher.data) {
        lastSuccess.current = fetcher.data;
        setBody("");
        setFormKey((key) => key + 1);
      }
      return;
    }
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error && submittedBody.current) {
      setBody(submittedBody.current);
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <section id="comments" className={compact ? "mt-8" : "mt-8 max-w-2xl lg:mt-10"}>
      <h2
        className={compact ? "text-[15px] font-medium" : "text-[15px] font-medium lg:text-[16px]"}
      >
        コメント
        <span className="ml-2 font-mono text-[11.5px] font-normal text-muted-foreground">
          {comments.length}
        </span>
      </h2>
      {compact ? null : (
        <p className="mt-1 hidden text-[12.5px] text-muted-foreground lg:block">
          あとから少しずつ残せます。スレッドやリアクションはありません。
        </p>
      )}

      {comments.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-muted-foreground">まだコメントはありません。</p>
      ) : (
        <ol className="mt-4 space-y-3 border-t border-border pt-3">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[13px] font-medium text-foreground">
                  {comment.authorName}
                </span>
                <time
                  className="font-mono text-[11px] text-muted-foreground"
                  dateTime={comment.createdAt}
                  title={formatDateJa(comment.createdAt)}
                >
                  {formatRelativeJa(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                {comment.body}
              </p>
            </li>
          ))}
        </ol>
      )}

      <fetcher.Form method="post" className="mt-4" onSubmit={hold} key={formKey}>
        <input type="hidden" name="intent" value="comment" />
        <label htmlFor="idea-comment" className="sr-only">
          コメント
        </label>
        <textarea
          id="idea-comment"
          name="body"
          rows={3}
          maxLength={COMMENT_BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="いまの観点・気づき"
          disabled={pending}
          className="ui-input h-auto min-h-[4.5rem] resize-y py-2"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {compact ? null : (
            <p className="mr-auto hidden text-[12px] text-muted-foreground lg:block">
              {SESSION_USER.label} として追加
            </p>
          )}
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            aria-busy={pending}
            className="ui-btn px-3"
          >
            {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
            {pending ? "送信中…" : "コメント送信"}
          </button>
        </div>
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </fetcher.Form>
    </section>
  );
}
