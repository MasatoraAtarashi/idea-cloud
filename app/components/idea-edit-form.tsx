import { useEffect, useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import { CategoryField } from "./category-field";
import { STAGES, type MockIdea, type Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { tagsInputValue, type EditIdeaActionData } from "../lib/idea-edit-action";
import { useInstantPending } from "../lib/use-instant-pending";
import type { AppData } from "../routes/app/layout";
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
  const t = useT();
  const { categories } = useOutletContext<AppData>();
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
        {t.idea.edit.title}
      </label>
      <textarea
        id="idea-edit-title"
        name="title"
        rows={2}
        value={title}
        onChange={(event) => setTitle(event.target.value.replace(/\n/g, " "))}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        disabled={pending}
        className="idea-title-wrap ui-title w-full resize-none border-0 bg-transparent text-[22px] leading-snug outline-none md:text-[23px]"
      />
      <label htmlFor="idea-edit-body" className="sr-only">
        {t.idea.edit.body}
      </label>
      <textarea
        id="idea-edit-body"
        name="body"
        rows={6}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={pending}
        className="mt-3 min-h-[7rem] w-full resize-y border-0 bg-transparent text-[15px] font-medium leading-relaxed text-foreground outline-none lg:text-[13.5px]"
      />
      <p className="mt-2 text-[11.5px] text-muted-foreground">{t.compose.urlHint}</p>
      <label
        htmlFor="idea-edit-tags"
        className="mt-3 block font-mono text-[11px] text-muted-foreground"
      >
        {t.idea.edit.tags}
      </label>
      <input
        id="idea-edit-tags"
        name="tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        disabled={pending}
        placeholder={t.idea.edit.tagsPlaceholder}
        className="ui-input mt-1"
      />
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{t.idea.edit.category}</p>
      <div className="mt-1">
        <CategoryField
          categories={categories}
          defaultId={idea.categoryId}
          disabled={pending}
          idPrefix="idea-edit"
        />
      </div>
      <label
        htmlFor="idea-edit-stage"
        className="mt-3 block font-mono text-[11px] text-muted-foreground"
      >
        {t.idea.edit.stage}
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
            {t.common.stage[item]}
          </option>
        ))}
      </select>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={pending} aria-busy={pending} className="ui-btn px-4">
          {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? t.idea.edit.saving : t.common.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="ui-btn-secondary px-4"
        >
          {t.common.cancel}
        </button>
      </div>
      {fail ? <p className="mt-2 text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}
