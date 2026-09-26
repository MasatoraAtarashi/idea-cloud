import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { canRunIdeaAi } from "../lib/idea-ai";
import {
  aiScoreMeaning,
  evaluationSectionLabel,
  parseEvaluationNotes,
  type EvaluationSectionLabel,
} from "../lib/evaluation-notes";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  DEFAULT_EVALUATE_PRESET,
  type ResearchPreset,
  evaluationModelLabel,
  presetFromModel,
} from "../lib/research-models";
import type { EvaluateIdeaActionData } from "../lib/idea-evaluate-action";
import { shortAgo } from "./ai-format";
import { IconSpinner, IconStar } from "./icons";

export function isEvaluateSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "evaluate";
}

function useEvaluateFetcher(ideaId: string) {
  return useFetcher<EvaluateIdeaActionData>({ key: `evaluate-${ideaId}` });
}

export function IdeaEvaluateControls({
  idea,
  error,
  preset,
  label,
  hint = true,
}: {
  idea: MockIdea;
  error?: EvaluateIdeaActionData["error"];
  /** Chosen in the AI 作業台 header. Falls back to the last evaluation model. */
  preset?: ResearchPreset;
  label?: string;
  hint?: boolean;
}) {
  const t = useT();
  const fetcher = useEvaluateFetcher(idea.id);
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const ready = canRunIdeaAi(idea.stage);
  const chosen = preset ?? presetFromModel(idea.aiEvaluationModel) ?? DEFAULT_EVALUATE_PRESET;
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;
  const evaluated = Boolean(idea.aiEvaluation || idea.aiScore);

  if (!ready) {
    return (
      <div>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {t.ai.archive.evaluate}
        </p>
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="evaluate" />
      <input type="hidden" name="preset" value={chosen} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="ui-btn-secondary shrink-0 px-3"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <IconStar className="h-3.5 w-3.5" />
          )}
          {pending
            ? t.ai.evaluate.running
            : (label ?? (evaluated ? t.ai.evaluate.rerun : t.ai.evaluate.run))}
        </button>
        {hint ? (
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            {t.ai.evaluate.hint(t.idea.evaluation.scoreLabel)}
          </p>
        ) : null}
      </div>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}

const SECTION_COLOR: Record<EvaluationSectionLabel, string> = {
  強み: "#067647",
  リスク: "#B42318",
  新規性: "#B54708",
  次の一手: "#4F46E5",
};

/** 推し度 card. Sits above every AI 作業台 tab. */
export function IdeaScoreCard({ idea, preset }: { idea: MockIdea; preset?: ResearchPreset }) {
  const t = useT();
  const fetcher = useEvaluateFetcher(idea.id);
  const pending = fetcher.state !== "idle";
  const parsed = idea.aiEvaluation?.trim() ? parseEvaluationNotes(idea.aiEvaluation) : null;
  const score = idea.aiScore ?? parsed?.score ?? null;
  const meaning = aiScoreMeaning(t, score);

  if (score == null && !parsed) {
    return (
      <section className="rounded-[10px] border border-border bg-card px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-muted-foreground">{t.idea.evaluation.scoreLabel}</span>
          <span className="font-mono text-[15px] font-semibold text-muted-foreground">—</span>
          <span className="text-[12px] text-muted-foreground">
            / 5 ・ {t.ai.evaluate.notScored}
          </span>
        </div>
        <div className="mt-3">
          <IdeaEvaluateControls idea={idea} preset={preset} hint={false} />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[10px] border border-border bg-card px-4 py-3.5 ${pending ? "opacity-60" : ""}`}
      aria-busy={pending}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] text-muted-foreground">{t.idea.evaluation.scoreLabel}</span>
        <span className="font-mono text-[24px] leading-none font-semibold tracking-[-0.02em]">
          {score ?? "—"}
        </span>
        <span className="text-[12px] text-muted-foreground">
          / 5{meaning ? ` ・ ${meaning}` : ""}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {pending ? t.ai.evaluate.inProgress : shortAgo(idea.aiEvaluatedAt)}
        </span>
      </div>
      {parsed ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {parsed.sections.map((section) => (
            <div key={section.label} className="rounded-[8px] bg-sunken px-3 py-2.5">
              <h4
                className="text-[11px] font-semibold"
                style={{ color: SECTION_COLOR[section.label] }}
              >
                {evaluationSectionLabel(t, section.label)}
              </h4>
              <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[12px] leading-[1.7] text-secondary">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function IdeaEvaluationView({
  notes,
  score,
  model,
  at,
}: {
  notes: string;
  score?: number | null;
  model?: string | null;
  at?: string | null;
}) {
  const t = useT();
  const parsed = notes.trim() ? parseEvaluationNotes(notes) : null;
  const shownScore = score ?? parsed?.score ?? null;
  const meaning = aiScoreMeaning(t, shownScore);
  const modelLabel = evaluationModelLabel(t, model);

  return (
    <div>
      {shownScore ? (
        <p className="flex items-baseline gap-2">
          <span className="text-[12px] text-muted-foreground">{t.idea.evaluation.scoreLabel}</span>
          <span className="font-mono text-[18px] font-semibold">{shownScore}</span>
          <span className="text-[12px] text-muted-foreground">
            / 5{meaning ? ` ・ ${meaning}` : ""}
          </span>
        </p>
      ) : null}
      {parsed ? (
        <div className={`${shownScore ? "mt-3" : ""} space-y-2`}>
          {parsed.sections.map((section) => (
            <section key={section.label} className="rounded-[8px] bg-sunken px-3 py-2.5">
              <h4
                className="text-[11px] font-semibold"
                style={{ color: SECTION_COLOR[section.label] }}
              >
                {evaluationSectionLabel(t, section.label)}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-[1.8] text-secondary">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      ) : notes.trim() ? (
        <p
          className={`${shownScore ? "mt-3" : ""} whitespace-pre-wrap text-[12.5px] leading-[1.8] text-secondary`}
        >
          {notes}
        </p>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">{t.ai.evaluate.noBody}</p>
      )}
      {modelLabel || at ? (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {[modelLabel, at ? formatDateJa(t, at) : ""].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export function IdeaEvaluateNotes({ idea, id }: { idea: MockIdea; id?: string }) {
  const t = useT();
  if (!idea.aiEvaluation) {
    return (
      <p id={id} className="mt-4 text-[12.5px] text-muted-foreground">
        {canRunIdeaAi(idea.stage) ? t.ai.evaluate.notRun : t.ai.evaluate.emptyArchived}
      </p>
    );
  }
  return (
    <section id={id} className="mt-4 rounded-[10px] border border-border bg-card px-4 py-3.5">
      <h3 className="mb-2.5 text-[12.5px] font-semibold">{t.ai.evaluate.fullTitle}</h3>
      <IdeaEvaluationView
        notes={idea.aiEvaluation}
        score={idea.aiScore}
        model={idea.aiEvaluationModel}
        at={idea.aiEvaluatedAt}
      />
    </section>
  );
}
