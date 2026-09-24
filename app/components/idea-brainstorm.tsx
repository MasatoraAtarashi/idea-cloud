import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { BRAINSTORM_ARCHIVE_ERROR, canRunIdeaAi } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  DEFAULT_BRAINSTORM_PRESET,
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
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
          {BRAINSTORM_ARCHIVE_ERROR}
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
          {pending ? "実行中…" : "ブレスト"}
        </button>
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          切り口・別案・次の問いを広げます。毎回残ります。
        </p>
      </div>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}

function modelLabelFor(model: string | null | undefined): string {
  const preset = presetFromModel(model);
  return preset ? RESEARCH_PRESET_LABEL[preset] : (model ?? "");
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
        {canRunIdeaAi(idea.stage)
          ? "まだ実行していません。"
          : `展開はまだありません。${BRAINSTORM_ARCHIVE_ERROR}`}
      </p>
    );
  }

  return (
    <ol id={id} className="mt-4 space-y-2.5">
      {rows.map((row, index) => (
        <li key={row.id} className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[12.5px] font-semibold">{index === 0 ? "最新" : "以前"}</h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              {[modelLabelFor(row.model), row.createdAt ? formatDateJa(row.createdAt) : ""]
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
