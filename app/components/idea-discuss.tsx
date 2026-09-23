import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import type { IdeaChatMessageView } from "../../db/discussions";
import { DISCUSS_BODY_MAX } from "../../db/discussions";
import type { MockIdea } from "../data/mock";
import { canRunIdeaAi, DISCUSS_ARCHIVE_ERROR } from "../lib/idea-ai";
import { formatDateJa, formatRelativeJa } from "../lib/format";
import { evaluationModelLabel } from "../lib/research-models";
import { useInstantPending } from "../lib/use-instant-pending";
import type { DiscussIdeaActionData } from "../lib/idea-discuss-action";
import { IconSpinner } from "./icons";

export const DISCUSS_STARTERS = [
  { label: "LPにするなら", body: "これLP作るとしたらどういう感じが良い？" },
  { label: "法的リスクは？", body: "これ法的リスクないかな？" },
  { label: "次の一手は？", body: "次の一手は？" },
  { label: "競合との差別化", body: "競合との差別化は？" },
] as const;

export function isDiscussSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "discuss";
}

export function IdeaDiscussLink({ ideaId, className }: { ideaId: string; className?: string }) {
  return (
    <Link
      to={`/app/ideas/${ideaId}#discuss`}
      className={className ?? "ui-btn-secondary w-full justify-start px-3 text-[13px]"}
    >
      AIと話す
    </Link>
  );
}

export function IdeaDiscuss({
  idea,
  messages,
  error,
}: {
  idea: MockIdea;
  messages: IdeaChatMessageView[];
  error?: string;
}) {
  const fetcher = useFetcher<DiscussIdeaActionData>();
  const busy = fetcher.state !== "idle" && isDiscussSubmitting(fetcher.formData);
  const { pending, hold } = useInstantPending(busy);
  const [body, setBody] = useState("");
  const [formKey, setFormKey] = useState(0);
  const lastSubmitted = useRef("");
  const resetFor = useRef<FormData | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ready = canRunIdeaAi(idea.stage);
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;
  const pendingBody =
    pending && isDiscussSubmitting(fetcher.formData)
      ? String(fetcher.formData?.get("body") ?? "").trim()
      : "";

  useEffect(() => {
    if (fetcher.state === "submitting" && isDiscussSubmitting(fetcher.formData)) {
      if (resetFor.current === fetcher.formData) return;
      resetFor.current = fetcher.formData;
      lastSubmitted.current = String(fetcher.formData?.get("body") ?? "");
      setBody("");
      setFormKey((key) => key + 1);
      return;
    }
    if (fetcher.state !== "idle" || resetFor.current === undefined) return;
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
      setBody(lastSubmitted.current);
      textareaRef.current?.focus();
    }
    lastSubmitted.current = "";
    resetFor.current = undefined;
  }, [fetcher.data, fetcher.formData, fetcher.state]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || !ready) return;
    hold();
    const data = new FormData();
    data.set("intent", "discuss");
    data.set("body", trimmed);
    void fetcher.submit(data, { method: "post" });
  }

  return (
    <section id="discuss" className="mt-4 max-w-2xl">
      <h2 className="text-[15px] font-semibold lg:text-[16px]">AIと話す</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        このアイデアについて質問できます。法律の判断はしません。
      </p>

      {messages.length === 0 && !pendingBody ? (
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          まだ会話はありません。下の質問から始められます。
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {pendingBody ? (
            <li className="flex justify-end">
              <div className="max-w-[85%] rounded-md bg-[var(--stage-spark-bg)] px-3 py-2.5">
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                  {pendingBody}
                </p>
              </div>
            </li>
          ) : null}
          {pending ? (
            <li className="flex justify-start">
              <p className="flex min-h-11 items-center gap-2 text-[13px] text-muted-foreground">
                <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                考えています…
              </p>
            </li>
          ) : null}
        </ol>
      )}

      {ready ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {DISCUSS_STARTERS.map((starter) => (
              <button
                key={starter.label}
                type="button"
                disabled={pending}
                onClick={() => send(starter.body)}
                className="ui-btn-secondary min-h-11 px-3 text-[13px]"
              >
                {starter.label}
              </button>
            ))}
          </div>
          <fetcher.Form
            method="post"
            className="mt-3"
            key={formKey}
            onSubmit={(event) => {
              if (!body.trim() || pending) {
                event.preventDefault();
                return;
              }
              hold();
            }}
          >
            <input type="hidden" name="intent" value="discuss" />
            <label htmlFor="idea-discuss" className="sr-only">
              AIへの質問
            </label>
            <textarea
              ref={textareaRef}
              id="idea-discuss"
              name="body"
              rows={3}
              maxLength={DISCUSS_BODY_MAX}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                if (!body.trim() || pending) return;
                event.currentTarget.form?.requestSubmit();
              }}
              placeholder="このアイデアについて聞く"
              readOnly={pending}
              autoComplete="off"
              enterKeyHint="send"
              className="ui-input h-auto min-h-[4.5rem] resize-y py-2"
            />
            <div className="mt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={pending || body.trim().length === 0}
                aria-busy={pending}
                className="ui-btn min-h-11 px-3"
              >
                {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
                {pending ? "送信中…" : "送信"}
              </button>
            </div>
          </fetcher.Form>
        </>
      ) : (
        <p className="mt-4 text-[12.5px] text-muted-foreground">{DISCUSS_ARCHIVE_ERROR}</p>
      )}
      {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
    </section>
  );
}

function ChatBubble({ message }: { message: IdeaChatMessageView }) {
  const mine = message.role === "user";
  const modelLabel = evaluationModelLabel(message.model);
  return (
    <li className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-md px-3 py-2.5 ${
          mine ? "bg-[var(--stage-spark-bg)]" : "border border-border bg-card"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[12px] font-semibold">{mine ? "あなた" : "AI"}</span>
          <time
            className="font-mono text-[11px] text-muted-foreground"
            dateTime={message.createdAt}
            title={formatDateJa(message.createdAt)}
          >
            {formatRelativeJa(message.createdAt)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
          {message.body}
        </p>
        {!mine && modelLabel ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">{modelLabel}</p>
        ) : null}
      </div>
    </li>
  );
}
