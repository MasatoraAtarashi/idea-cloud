import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { STAGE_LABEL, STAGES, type MockIdea, type Stage } from "../data/mock";
import { tagsInputValue, type EditIdeaActionData } from "../lib/idea-edit-action";
import { useInstantPending } from "../lib/use-instant-pending";
import { IconSpinner } from "./icons";

export function IdeaEditForm({
  idea,
  onCancel,
  error,
}: {
  idea: MockIdea;
  onCancel: () => void;
  error?: string;
}) {
  const fetcher = useFetcher<EditIdeaActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const [title, setTitle] = useState(idea.title);
  const [body, setBody] = useState(idea.body);
  const [tags, setTags] = useState(tagsInputValue(idea.tags));
  const [stage, setStage] = useState<Stage>(idea.stage);
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      onCancel();
    }
  }, [fetcher.data, fetcher.state, onCancel]);

  return (
    <fetcher.Form method="post" className="mt-3" onSubmit={hold}>
      <input type="hidden" name="intent" value="edit" />
      <label htmlFor="idea-edit-title" className="sr-only">
        タイトル
      </label>
      <input
        id="idea-edit-title"
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={pending}
        className="ui-title w-full border-0 bg-transparent text-[22px] leading-snug outline-none md:text-[23px]"
      />
      <label htmlFor="idea-edit-body" className="sr-only">
        本文
      </label>
      <textarea
        id="idea-edit-body"
        name="body"
        rows={6}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={pending}
        className="mt-3 min-h-[7rem] w-full resize-y border-0 bg-transparent text-[13.5px] leading-relaxed text-muted-foreground outline-none"
      />
      <label
        htmlFor="idea-edit-tags"
        className="mt-3 block font-mono text-[11px] text-muted-foreground"
      >
        タグ
      </label>
      <input
        id="idea-edit-tags"
        name="tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        disabled={pending}
        placeholder="カンマまたは読点で区切る"
        className="ui-input mt-1"
      />
      <label
        htmlFor="idea-edit-stage"
        className="mt-3 block font-mono text-[11px] text-muted-foreground"
      >
        段階
      </label>
      <select
        id="idea-edit-stage"
        name="stage"
        value={stage}
        onChange={(event) => setStage(event.target.value as Stage)}
        disabled={pending}
        className="ui-input mt-1"
      >
        {STAGES.map((item) => (
          <option key={item} value={item}>
            {STAGE_LABEL[item]}
          </option>
        ))}
      </select>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={pending} aria-busy={pending} className="ui-btn px-4">
          {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="ui-btn-secondary px-4"
        >
          キャンセル
        </button>
      </div>
      {fail ? <p className="mt-2 text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}
