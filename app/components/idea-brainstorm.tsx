import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { canRunIdeaAi } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  DEFAULT_BRAINSTORM_PRESET,
  researchPresetLabel,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { Dictionary } from "../i18n/dictionary";
import type { BrainstormIdeaActionData } from "../lib/idea-brainstorm-action";
import { IconBrainstorm, IconSpinner } from "./icons";

export function isBrainstormSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "brainstorm";
}

export type BrainstormEntry = {
  id: string;
  notes: string;
  model: string;
  createdAt: string;
};

export function IdeaBrainstormControls({
  idea,
  error,
  preset,
}: {
  idea: MockIdea;
  error?: BrainstormIdeaActionData["error"];
  /** Chosen in the AI 作業台 header. Falls back to the last brainstorm model. */
  preset?: ResearchPreset;
}) {
  const t = useT();
  const fetcher = useFetcher<BrainstormIdeaActionData>({ key: `brainstorm-${idea.id}` });
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const ready = canRunIdeaAi(idea.stage);
  const chosen = preset ?? presetFromModel(idea.brainstormModel) ?? DEFAULT_BRAINSTORM_PRESET;
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  if (!ready) {
    return (
      <div>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {t.ai.archive.brainstorm}
        </p>
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="brainstorm" />
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
            <IconBrainstorm className="h-3.5 w-3.5" />
          )}
          {pending ? t.ai.brainstorm.running : t.ai.brainstorm.run}
        </button>
        <p className="text-[11.5px] leading-snug text-muted-foreground">{t.ai.brainstorm.hint}</p>
      </div>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}

function modelLabelFor(t: Dictionary, model: string | null | undefined): string {
  const preset = presetFromModel(model);
  return preset ? researchPresetLabel(t, preset) : (model ?? "");
}

/** Every brainstorm run, newest first. Falls back to the idea's latest notes. */
export function IdeaBrainstormNotes({
  idea,
  entries = [],
  id,
}: {
  idea: MockIdea;
  entries?: BrainstormEntry[];
  id?: string;
}) {
  const t = useT();
  const rows: BrainstormEntry[] =
    entries.length > 0
      ? [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : idea.brainstormNotes
        ? [
            {
              id: "latest",
              notes: idea.brainstormNotes,
              model: idea.brainstormModel ?? "",
              createdAt: idea.brainstormedAt ?? "",
            },
          ]
        : [];

  if (rows.length === 0) {
    return (
      <p id={id} className="mt-4 text-[12.5px] text-muted-foreground">
        {canRunIdeaAi(idea.stage) ? t.ai.brainstorm.notRun : t.ai.brainstorm.emptyArchived}
      </p>
    );
  }

  return (
    <ol id={id} className="mt-4 space-y-2.5">
      {rows.map((row, index) => (
        <li key={row.id} className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[12.5px] font-semibold">
              {index === 0 ? t.ai.brainstorm.latest : t.ai.brainstorm.previous}
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              {[modelLabelFor(t, row.model), row.createdAt ? formatDateJa(t, row.createdAt) : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.9] text-secondary">
            {row.notes}
          </p>
        </li>
      ))}
    </ol>
  );
}
