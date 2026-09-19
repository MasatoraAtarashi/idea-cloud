import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { canRunIdeaAi, EVALUATE_ARCHIVE_ERROR } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  DEFAULT_EVALUATE_PRESET,
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  evaluationModelLabel,
  presetFromModel,
} from "../lib/research-models";
import type { EvaluateIdeaActionData } from "../lib/idea-evaluate-action";
import { IconSpinner, IconStar } from "./icons";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function isEvaluateSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "evaluate";
}

export function IdeaEvaluateControls({
  idea,
  error,
  compact = false,
}: {
  idea: MockIdea;
  error?: EvaluateIdeaActionData["error"];
  compact?: boolean;
}) {
  const fetcher = useFetcher<EvaluateIdeaActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const ready = canRunIdeaAi(idea.stage);
  const defaultPreset = presetFromModel(idea.aiEvaluationModel) ?? DEFAULT_EVALUATE_PRESET;
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  if (!ready) {
    return (
      <div>
        <span className="ui-btn-secondary w-full cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
          <IconStar className="h-3.5 w-3.5" />
          AI評価
        </span>
        {compact ? null : (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {EVALUATE_ARCHIVE_ERROR}
          </p>
        )}
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="evaluate" />
      {compact ? (
        <input type="hidden" name="preset" value={defaultPreset} />
      ) : (
        <>
          <label className="sr-only" htmlFor="evaluate-preset">
            プリセット
          </label>
          <select
            id="evaluate-preset"
            name="preset"
            defaultValue={defaultPreset}
            disabled={pending}
            className="ui-input text-[13px]"
          >
            {PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {RESEARCH_PRESET_LABEL[preset]}
              </option>
            ))}
          </select>
        </>
      )}
      <button
        type="submit"
        className="ui-btn-secondary w-full justify-start px-3 text-[13px]"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <IconSpinner className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconStar className="h-3.5 w-3.5" />
        )}
        {pending ? "実行中…" : "AI評価"}
      </button>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
      {compact ? null : (
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          強み・リスク・新規性・次の一手と 1–5 の点数です。Jev 利用時は分解スコアです。
        </p>
      )}
    </fetcher.Form>
  );
}

export function IdeaEvaluateNotes({ idea, id }: { idea: MockIdea; id?: string }) {
  const modelLabel = evaluationModelLabel(idea.aiEvaluationModel);

  return (
    <section id={id} className="mt-6">
      <h3 className="text-[13.5px] font-medium">AI評価</h3>
      {idea.aiEvaluation ? (
        <div className="ui-panel mt-2 p-3">
          <p className="font-mono text-[11px] text-muted-foreground">
            {idea.aiScore ? `AI ${idea.aiScore}` : "点数なし"}
            {modelLabel ? ` · ${modelLabel}` : ""}
            {idea.aiEvaluatedAt ? ` · ${formatDateJa(idea.aiEvaluatedAt)}` : ""}
          </p>
          {idea.aiEvaluationModel ? (
            <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
              {idea.aiEvaluationModel}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
            {idea.aiEvaluation}
          </p>
        </div>
      ) : canRunIdeaAi(idea.stage) ? (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          まだ実行していません。上のプリセットから評価できます。
        </p>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          評価はまだありません。{EVALUATE_ARCHIVE_ERROR}
        </p>
      )}
    </section>
  );
}
