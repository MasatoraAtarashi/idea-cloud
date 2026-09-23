import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import {
  REFLECTION_NOTES_MAX,
  REFLECTION_OUTCOME_MAX,
  REFLECTION_STATUS_LABEL,
  REFLECTION_STATUSES,
  hasReflection,
  type ReflectionStatus,
} from "../lib/reflection";
import type { ReflectionIdeaActionData } from "../lib/idea-reflection-action";
import { useInstantPending } from "../lib/use-instant-pending";
import { IconSpinner } from "./icons";

export function ReflectionBadge({ idea }: { idea: MockIdea }) {
  if (!hasReflection(idea)) return null;
  const status = (idea.reflectionStatus ?? "none") as ReflectionStatus;
  const snippet = (idea.reflectionOutcome ?? "").trim();
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {status === "none" ? "振り返り" : REFLECTION_STATUS_LABEL[status]}
      {snippet ? ` · ${snippet}` : ""}
    </span>
  );
}

export function IdeaReflectionForm({ idea, error }: { idea: MockIdea; error?: string }) {
  const fetcher = useFetcher<ReflectionIdeaActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const [outcome, setOutcome] = useState(idea.reflectionOutcome ?? "");
  const [notes, setNotes] = useState(idea.reflectionNotes ?? "");
  const [status, setStatus] = useState<ReflectionStatus>(idea.reflectionStatus ?? "none");
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  useEffect(() => {
    setOutcome(idea.reflectionOutcome ?? "");
    setNotes(idea.reflectionNotes ?? "");
    setStatus(idea.reflectionStatus ?? "none");
  }, [idea.id, idea.reflectionNotes, idea.reflectionOutcome, idea.reflectionStatus]);

  return (
    <section className="mt-6">
      <h3 className="text-[13.5px] font-semibold">振り返り</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">
        試したあとの結果だけ残します。AIにはまだ使いません。
      </p>
      <fetcher.Form method="post" className="mt-2" onSubmit={hold}>
        <input type="hidden" name="intent" value="reflection" />
        <div className="flex flex-wrap gap-1.5">
          {REFLECTION_STATUSES.map((value) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center rounded-full px-3 text-[12.5px] ${
                status === value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="reflectionStatus"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="sr-only"
              />
              {REFLECTION_STATUS_LABEL[value]}
            </label>
          ))}
        </div>
        <label htmlFor="reflection-outcome" className="sr-only">
          やってみた結果
        </label>
        <input
          id="reflection-outcome"
          name="outcome"
          value={outcome}
          maxLength={REFLECTION_OUTCOME_MAX}
          onChange={(event) => setOutcome(event.target.value)}
          placeholder="やってみた結果"
          className="ui-input mt-2"
        />
        <label htmlFor="reflection-notes" className="sr-only">
          振り返りメモ
        </label>
        <textarea
          id="reflection-notes"
          name="notes"
          value={notes}
          maxLength={REFLECTION_NOTES_MAX}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="メモ（任意）"
          rows={3}
          className="ui-input mt-2 min-h-[5rem] py-2"
        />
        <button type="submit" disabled={pending} className="ui-btn mt-2 px-3 text-[13px]">
          {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "保存中…" : "振り返りを保存"}
        </button>
      </fetcher.Form>
      {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
    </section>
  );
}
