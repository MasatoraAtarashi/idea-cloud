import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { formatDateJa } from "../lib/format";
import { HUMAN_SCORE_NOTE_MAX } from "../lib/scores";
import { useInstantPending } from "../lib/use-instant-pending";
import type { HumanScoreActionData } from "../lib/idea-score-action";
import { IconSpinner } from "./icons";

const SCORES = [1, 2, 3, 4, 5] as const;

export function IdeaScoreChips({ idea }: { idea: MockIdea }) {
  if (!idea.humanScore && !idea.aiScore) return null;
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {idea.humanScore ? `人${idea.humanScore}` : null}
      {idea.humanScore && idea.aiScore ? " " : null}
      {idea.aiScore ? `AI${idea.aiScore}` : null}
    </span>
  );
}

export function IdeaHumanScore({
  idea,
  compact = false,
  error,
}: {
  idea: MockIdea;
  compact?: boolean;
  error?: string;
}) {
  const fetcher = useFetcher<HumanScoreActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const [note, setNote] = useState(idea.humanScoreNote ?? "");
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  useEffect(() => {
    setNote(idea.humanScoreNote ?? "");
  }, [idea.humanScoreNote, idea.id]);

  return (
    <section className={compact ? "mt-5" : "mt-6"}>
      <h3 className="text-[13.5px] font-medium">評価</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">
        1–5 の点数。任意で短いメモを残せます。
      </p>
      <fetcher.Form method="post" className="mt-2" onSubmit={hold}>
        <input type="hidden" name="intent" value="human-score" />
        <div className="flex flex-wrap gap-1.5">
          {SCORES.map((score) => (
            <button
              key={score}
              type="submit"
              name="score"
              value={score}
              disabled={pending}
              aria-pressed={idea.humanScore === score}
              className={`flex h-11 min-w-11 items-center justify-center rounded-md text-[13.5px] font-medium md:h-8 md:min-w-8 ${
                idea.humanScore === score
                  ? "bg-foreground text-background"
                  : "border border-border-control bg-card text-foreground hover:bg-row-hover"
              }`}
            >
              {pending && idea.humanScore !== score ? (
                <IconSpinner className="h-3.5 w-3.5 animate-spin" />
              ) : (
                score
              )}
            </button>
          ))}
        </div>
        <label htmlFor="human-score-note" className="sr-only">
          評価メモ
        </label>
        <input
          id="human-score-note"
          name="note"
          value={note}
          maxLength={HUMAN_SCORE_NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
          placeholder="短いメモ（任意）"
          className="ui-input mt-2"
        />
      </fetcher.Form>
      {idea.humanScoredAt ? (
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {formatDateJa(idea.humanScoredAt)}
          {idea.humanScoreNote ? ` · ${idea.humanScoreNote}` : ""}
        </p>
      ) : null}
      {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
    </section>
  );
}
