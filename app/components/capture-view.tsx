import { useState, type KeyboardEvent } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import {
  COMPOSE_PLACEHOLDER,
  COMPOSE_SUBMIT,
  COMPOSE_TITLE,
  COMPOSE_TITLE_PLACEHOLDER,
  COMPOSE_URL_HINT,
} from "../lib/compose";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { LIST_PATH } from "../lib/home-path";
import { isSubmitShortcut } from "../lib/shortcuts";
import { useInstantPending } from "../lib/use-instant-pending";
import { STAGE_LABEL, STAGE_PILL_CLASS, STAGES, type Stage } from "../data/mock";
import { IconSpinner } from "./icons";
import { StageSelect } from "./stage-select";

export function CaptureView({ autofocus = false }: { autofocus?: boolean }) {
  const actionData = useActionData() as CreateIdeaActionData | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const { pending, hold } = useInstantPending(submitting);
  const [title, setTitle] = useState(actionData?.title ?? "");
  const [draft, setDraft] = useState(actionData?.body ?? "");
  const [stage, setStage] = useState<Stage>("spark");
  const [tags, setTags] = useState("");
  const canSubmit = Boolean((title.trim() || draft.trim()) && !pending);

  function onComposeKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] md:hidden">
        <Form method="post" className="flex min-h-0 flex-1 flex-col" onSubmit={hold}>
          <input type="hidden" name="stage" value={stage} />
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Link
              to={LIST_PATH}
              className="flex min-h-11 min-w-[3.5rem] items-center text-[13.5px] font-medium text-foreground no-underline"
            >
              閉じる
            </Link>
            <p className="text-[13.5px] font-semibold tracking-tight">{COMPOSE_TITLE}</p>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={pending}
              className="ui-btn min-w-[4.5rem] rounded-full px-4 text-[13.5px] disabled:opacity-40"
            >
              {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
              {pending ? "作成中" : COMPOSE_SUBMIT}
            </button>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col">
            <label htmlFor="idea-mobile-title" className="sr-only">
              {COMPOSE_TITLE_PLACEHOLDER}
            </label>
            <input
              id="idea-mobile-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={onComposeKeyDown}
              autoFocus={autofocus}
              placeholder={COMPOSE_TITLE_PLACEHOLDER}
              className="ui-title w-full border-0 bg-transparent text-[22px] leading-snug text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <label htmlFor="idea-mobile" className="sr-only">
              {COMPOSE_PLACEHOLDER}
            </label>
            <textarea
              id="idea-mobile"
              name="body"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposeKeyDown}
              placeholder={COMPOSE_PLACEHOLDER}
              className="mt-3 min-h-[8.5rem] w-full flex-1 resize-none border-0 bg-transparent text-[16px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            {STAGES.filter((item) => item !== "archived").map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStage(item)}
                className={`stage-pill min-h-11 px-3 text-[12.5px] ${STAGE_PILL_CLASS[item]} ${
                  stage === item ? "ring-1 ring-foreground/20" : "opacity-70"
                }`}
              >
                {STAGE_LABEL[item]}
              </button>
            ))}
            <input
              name="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="空なら自動タグ"
              className="min-h-11 min-w-[7.5rem] flex-1 rounded-full border border-dashed border-border-control bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="pb-2 text-[12px] leading-relaxed text-muted-foreground">
            タグを空のまま作成すると自動で付けます。失敗しても残ります。
            {COMPOSE_URL_HINT}
          </p>

          <div className="flex min-h-11 items-center justify-end border-t border-border text-muted-foreground">
            <span className="font-mono text-[12px]">2週間寝かせる</span>
          </div>
          {actionData?.error ? (
            <p className="pb-4 text-xs text-muted-foreground">{actionData.error}</p>
          ) : null}
        </Form>
      </div>

      <div className="mx-auto hidden max-w-2xl px-6 py-8 md:block">
        <h1 className="text-[16px] font-medium tracking-tight">{COMPOSE_TITLE}</h1>
        <Form method="post" className="ui-panel mt-4 p-4" onSubmit={hold}>
          <input
            name="title"
            defaultValue={actionData?.title ?? ""}
            placeholder={COMPOSE_TITLE_PLACEHOLDER}
            className="ui-title w-full border-0 bg-transparent text-[20px] outline-none"
          />
          <textarea
            name="body"
            defaultValue={actionData?.body ?? ""}
            onKeyDown={onComposeKeyDown}
            rows={6}
            placeholder={COMPOSE_PLACEHOLDER}
            className="mt-2 h-auto w-full resize-none border-0 bg-transparent py-2 text-[13.5px] outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <StageSelect defaultValue="spark" />
              <input
                name="tags"
                placeholder="空なら自動タグ"
                className="h-8 min-w-[8rem] flex-1 rounded-full border border-dashed border-border-control bg-transparent px-3 text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button type="submit" disabled={!canSubmit} aria-busy={pending} className="ui-btn px-4">
              {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
              {pending ? "作成中" : COMPOSE_SUBMIT}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            タグを空のまま作成すると、短い日本語タグを自動で付けます。
            {COMPOSE_URL_HINT}
          </p>
        </Form>
        {actionData?.error ? (
          <p className="mt-3 text-xs text-muted-foreground">{actionData.error}</p>
        ) : null}
      </div>
    </>
  );
}
