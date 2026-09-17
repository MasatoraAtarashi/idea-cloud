import { useState, type KeyboardEvent } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { COMPOSE_PLACEHOLDER, COMPOSE_SUBMIT, COMPOSE_TITLE } from "../lib/compose";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { LIST_PATH } from "../lib/home-path";
import { isSubmitShortcut } from "../lib/shortcuts";
import { IconBack, IconClock, IconGif, IconImage, IconPin, IconPoll, IconUsers } from "./icons";

const STUB_TOOLS = [
  { label: "画像（未配線）", Icon: IconImage },
  { label: "GIF（未配線）", Icon: IconGif },
  { label: "投票（未配線）", Icon: IconPoll },
  { label: "予約（未配線）", Icon: IconClock },
  { label: "位置（未配線）", Icon: IconPin },
] as const;

export function CaptureView({ autofocus = false }: { autofocus?: boolean }) {
  const actionData = useActionData() as CreateIdeaActionData | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const [draft, setDraft] = useState(actionData?.body ?? "");
  const canSubmit = Boolean(draft.trim()) && !submitting;

  function onComposeKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col bg-background px-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <Form method="post" className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={LIST_PATH}
              aria-label="戻る"
              className="flex h-10 w-10 items-center justify-center text-foreground no-underline"
            >
              <IconBack className="h-6 w-6" />
            </Link>
            <p className="text-[13px] font-medium tracking-tight">{COMPOSE_TITLE}</p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ui-btn h-8 rounded-full px-4 text-[13px] disabled:opacity-40"
            >
              {COMPOSE_SUBMIT}
            </button>
          </div>

          <div className="mt-3 flex min-h-[8.5rem] gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconUsers className="h-4 w-4" />
            </span>
            <label htmlFor="idea-mobile" className="sr-only">
              {COMPOSE_PLACEHOLDER}
            </label>
            <textarea
              id="idea-mobile"
              name="body"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposeKeyDown}
              autoFocus={autofocus}
              placeholder={COMPOSE_PLACEHOLDER}
              className="min-h-[8.5rem] w-full resize-none border-0 bg-transparent pt-1.5 text-[20px] leading-snug text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-4 flex items-center gap-0.5 border-t border-border py-2">
            {STUB_TOOLS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center text-muted-foreground disabled:opacity-50"
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
          {actionData?.error ? (
            <p className="pb-4 text-xs text-muted-foreground">{actionData.error}</p>
          ) : null}
        </Form>
      </div>

      <div className="mx-auto hidden max-w-2xl md:block">
        <h1 className="text-[15px] font-medium tracking-tight">{COMPOSE_TITLE}</h1>
        <Form method="post" className="ui-panel mt-4 p-4">
          <label htmlFor="idea-desktop" className="text-xs text-muted-foreground">
            {COMPOSE_TITLE}
          </label>
          <textarea
            id="idea-desktop"
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onComposeKeyDown}
            rows={6}
            placeholder={COMPOSE_PLACEHOLDER}
            className="ui-input mt-2 h-auto resize-none py-3"
          />
          <div className="mt-3 flex items-center justify-between">
            <button type="submit" disabled={!canSubmit} className="ui-btn px-4">
              {COMPOSE_SUBMIT}
            </button>
            <Link
              to={LIST_PATH}
              className="text-[13px] text-muted-foreground no-underline hover:text-foreground"
            >
              一覧
            </Link>
          </div>
        </Form>
        {actionData?.error ? (
          <p className="mt-3 text-xs text-muted-foreground">{actionData.error}</p>
        ) : null}
      </div>
    </>
  );
}
