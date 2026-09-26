import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import type { IdeaChatMessageView } from "../../db/discussions";
import { DISCUSS_BODY_MAX } from "../../db/discussions";
import type { MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { canRunIdeaAi } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import type { ResearchPreset } from "../lib/research-models";
import { useInstantPending } from "../lib/use-instant-pending";
import type { DiscussIdeaActionData } from "../lib/idea-discuss-action";
import { shortModelName } from "./ai-format";

export function isDiscussSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "discuss";
}

/** Thread and composer live in different parts of the AI 作業台; one keyed fetcher links them. */
function useDiscussFetcher(ideaId: string) {
  return useFetcher<DiscussIdeaActionData>({ key: `discuss-${ideaId}` });
}

export function IdeaDiscussLink({ ideaId, className }: { ideaId: string; className?: string }) {
  const t = useT();
  return (
    <Link
      to={`/app/ideas/${ideaId}#discuss`}
      className={className ?? "ui-btn-secondary w-full justify-start px-3 text-[13px]"}
    >
      {t.ai.discuss.link}
    </Link>
  );
}

export function IdeaDiscussThread({
  idea,
  messages,
  error,
}: {
  idea: MockIdea;
  messages: IdeaChatMessageView[];
  error?: string;
}) {
  const t = useT();
  const fetcher = useDiscussFetcher(idea.id);
  const pending = fetcher.state !== "idle" && isDiscussSubmitting(fetcher.formData);
  const pendingBody = pending ? String(fetcher.formData?.get("body") ?? "").trim() : "";
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pendingBody]);

  // The composer already says why 相談 is locked on archive.
  if (!canRunIdeaAi(idea.stage) && messages.length === 0) return null;

  return (
    <section id="discuss" className="mt-4">
      {messages.length === 0 && !pendingBody ? (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">{t.ai.discuss.intro}</p>
      ) : (
        <ol className="space-y-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {pendingBody ? (
            <li className="flex justify-end">
              <p className="max-w-[88%] rounded-[12px_12px_4px_12px] bg-foreground px-3.5 py-2.5 text-[13px] leading-[1.8] whitespace-pre-wrap text-white">
                {pendingBody}
              </p>
            </li>
          ) : null}
        </ol>
      )}
      <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        {pending ? (
          <>
            <span className="h-[6px] w-[6px] rounded-full bg-[#F79009]" aria-hidden="true" />
            generating…
          </>
        ) : messages.length > 0 ? (
          <>
            <span className="h-[6px] w-[6px] rounded-full bg-[#17B26A]" aria-hidden="true" />
            saved
            <span aria-hidden="true">·</span>
            <span className="font-sans">{t.ai.discuss.saved}</span>
          </>
        ) : null}
      </p>
      {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      <div ref={endRef} />
    </section>
  );
}

export function IdeaDiscussComposer({ idea, preset }: { idea: MockIdea; preset: ResearchPreset }) {
  const t = useT();
  const fetcher = useDiscussFetcher(idea.id);
  const busy = fetcher.state !== "idle" && isDiscussSubmitting(fetcher.formData);
  const { pending, hold } = useInstantPending(busy);
  const [body, setBody] = useState("");
  const [formKey, setFormKey] = useState(0);
  const lastSubmitted = useRef("");
  const resetFor = useRef<FormData | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ready = canRunIdeaAi(idea.stage);

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
      inputRef.current?.focus();
    }
    lastSubmitted.current = "";
    resetFor.current = undefined;
  }, [fetcher.data, fetcher.formData, fetcher.state]);

  if (!ready) {
    return (
      <p className="rounded-[10px] border border-border bg-card px-3.5 py-3 text-[12.5px] text-muted-foreground">
        {t.ai.archive.discuss}
      </p>
    );
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    hold();
    const data = new FormData();
    data.set("intent", "discuss");
    data.set("body", trimmed);
    data.set("preset", preset);
    void fetcher.submit(data, { method: "post" });
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2.5">
        {t.ai.discuss.starters.map((starter) => (
          <button
            key={starter.label}
            type="button"
            disabled={pending}
            onClick={() => send(starter.body)}
            className="chip-pill shrink-0"
          >
            {starter.label}
          </button>
        ))}
      </div>
      <fetcher.Form
        method="post"
        key={formKey}
        className="flex items-end gap-2 rounded-[10px] border border-border-control bg-card py-1.5 pr-1.5 pl-3.5 focus-within:border-ring"
        onSubmit={(event) => {
          if (!body.trim() || pending) {
            event.preventDefault();
            return;
          }
          hold();
        }}
      >
        <input type="hidden" name="intent" value="discuss" />
        <input type="hidden" name="preset" value={preset} />
        <label htmlFor="idea-discuss" className="sr-only">
          {t.ai.discuss.inputLabel}
        </label>
        <textarea
          ref={inputRef}
          id="idea-discuss"
          name="body"
          rows={1}
          maxLength={DISCUSS_BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (!body.trim() || pending) return;
            event.currentTarget.form?.requestSubmit();
          }}
          placeholder={t.ai.discuss.placeholder}
          readOnly={pending}
          autoComplete="off"
          enterKeyHint="send"
          className="max-h-32 min-h-[32px] flex-1 resize-none self-center bg-transparent py-1.5 text-[13.5px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={pending || body.trim().length === 0}
          aria-busy={pending}
          aria-label={t.ai.discuss.send}
          className="ui-btn-ai h-11 w-11 shrink-0 px-0 text-[16px] md:h-8 md:min-h-8 md:w-auto md:px-3 md:text-[12.5px]"
        >
          <span className="md:hidden" aria-hidden="true">
            ↑
          </span>
          <span className="hidden md:inline">
            {pending ? t.ai.discuss.sending : t.ai.discuss.send}
          </span>
        </button>
      </fetcher.Form>
    </div>
  );
}

function ChatBubble({ message }: { message: IdeaChatMessageView }) {
  const t = useT();
  const mine = message.role === "user";
  const model = shortModelName(message.model);
  return (
    <li className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className={mine ? "max-w-[88%]" : "max-w-[92%]"}>
        <p
          title={formatDateJa(t, message.createdAt)}
          className={
            mine
              ? "rounded-[12px_12px_4px_12px] bg-foreground px-3.5 py-2.5 text-[13px] leading-[1.8] whitespace-pre-wrap text-white"
              : "rounded-[12px_12px_12px_4px] border border-border bg-card px-4 py-3 text-[13px] leading-[1.9] whitespace-pre-wrap text-secondary"
          }
        >
          {message.body}
        </p>
        {!mine && model ? (
          <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">{model}</p>
        ) : null}
      </div>
    </li>
  );
}
