import { useState, type KeyboardEvent } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import {
  COMPOSE_PLACEHOLDER,
  COMPOSE_SUBMIT,
  COMPOSE_TITLE,
  COMPOSE_TITLE_PLACEHOLDER,
} from "../lib/compose";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { LIST_PATH } from "../lib/home-path";
import { isSubmitShortcut } from "../lib/shortcuts";
import { STAGE_LABEL, STAGE_PILL_CLASS, STAGES, type Stage } from "../data/mock";
import { IconHash, IconList, IconType } from "./icons";
import { StageSelect } from "./stage-select";

export function CaptureView({ autofocus = false }: { autofocus?: boolean }) {
  const actionData = useActionData() as CreateIdeaActionData | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const [title, setTitle] = useState(actionData?.title ?? "");
  const [draft, setDraft] = useState(actionData?.body ?? "");
  const [stage, setStage] = useState<Stage>("spark");
  const canSubmit = Boolean((title.trim() || draft.trim()) && !submitting);

  function onComposeKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col bg-background px-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <Form method="post" className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="stage" value={stage} />
          <div className="flex items-center justify-between gap-3">
            <Link to={LIST_PATH} className="text-[13.5px] text-muted-foreground no-underline">
              閉じる
            </Link>
            <p className="text-[13.5px] font-medium tracking-tight">{COMPOSE_TITLE}</p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ui-btn h-8 rounded-full px-4 text-[13.5px] disabled:opacity-40"
            >
              {COMPOSE_SUBMIT}
            </button>
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
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
              className="mt-3 min-h-[8.5rem] w-full flex-1 resize-none border-0 bg-transparent text-[15px] leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            {STAGES.filter((item) => item !== "archived").map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStage(item)}
                className={`stage-pill ${STAGE_PILL_CLASS[item]} ${
                  stage === item ? "ring-1 ring-foreground/15" : "opacity-70"
                }`}
              >
                {STAGE_LABEL[item]}
              </button>
            ))}
            <span className="inline-flex h-7 items-center rounded-full border border-dashed border-border-control px-2.5 text-[12px] text-muted-foreground">
              + タグ
            </span>
          </div>

          <div className="flex items-center gap-1 border-t border-border py-2 text-muted-foreground">
            <span className="flex h-9 w-9 items-center justify-center" aria-hidden="true">
              <IconType className="h-4 w-4" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center" aria-hidden="true">
              <IconList className="h-4 w-4" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center" aria-hidden="true">
              <IconHash className="h-4 w-4" />
            </span>
            <span className="ml-auto font-mono text-[12px]">2週間寝かせる</span>
          </div>
          {actionData?.error ? (
            <p className="pb-4 text-xs text-muted-foreground">{actionData.error}</p>
          ) : null}
        </Form>
      </div>

      <div className="mx-auto hidden max-w-2xl px-6 py-8 md:block">
        <h1 className="text-[16px] font-medium tracking-tight">{COMPOSE_TITLE}</h1>
        <Form method="post" className="ui-panel mt-4 p-4">
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
          <div className="mt-3 flex items-center justify-between">
            <StageSelect defaultValue="spark" />
            <button type="submit" disabled={submitting} className="ui-btn px-4">
              {COMPOSE_SUBMIT}
            </button>
          </div>
        </Form>
        {actionData?.error ? (
          <p className="mt-3 text-xs text-muted-foreground">{actionData.error}</p>
        ) : null}
      </div>
    </>
  );
}
