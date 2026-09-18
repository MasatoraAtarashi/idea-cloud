import { Form, useNavigation } from "react-router";
import { COMMENT_BODY_MAX, type IdeaCommentView } from "../../db/comments";
import { formatDateJa, formatRelativeJa } from "../lib/format";
import { SESSION_USER } from "../data/mock";

export function isCommentSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "comment";
}

export function IdeaComments({ comments, error }: { comments: IdeaCommentView[]; error?: string }) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle" && isCommentSubmitting(navigation.formData);

  return (
    <section id="comments" className="mt-10 max-w-2xl">
      <h2 className="text-[16px] font-medium">
        コメント
        <span className="ml-2 font-mono text-[11.5px] font-normal text-muted-foreground">
          {comments.length}
        </span>
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        あとから少しずつ残せます。スレッドやリアクションはありません。
      </p>

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

      <Form method="post" className="mt-4">
        <input type="hidden" name="intent" value="comment" />
        <label htmlFor="idea-comment" className="sr-only">
          コメント
        </label>
        <textarea
          id="idea-comment"
          key={comments.length}
          name="body"
          rows={3}
          maxLength={COMMENT_BODY_MAX}
          placeholder="いまの観点・気づき"
          disabled={submitting}
          className="ui-input h-auto min-h-[4.5rem] resize-y py-2"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">{SESSION_USER.label} として追加</p>
          <button type="submit" disabled={submitting} className="ui-btn h-8 px-3">
            {submitting ? "追加中…" : "追加"}
          </button>
        </div>
        {error ? <p className="mt-1.5 text-[12.5px] text-danger">{error}</p> : null}
      </Form>
    </section>
  );
}
