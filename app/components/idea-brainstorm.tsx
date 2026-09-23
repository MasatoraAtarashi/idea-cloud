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

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function isBrainstormSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "brainstorm";
}

export function IdeaBrainstormControls({
  idea,
  error,
  compact = false,
}: {
  idea: MockIdea;
  error?: BrainstormIdeaActionData["error"];
  compact?: boolean;
}) {
  const fetcher = useFetcher<BrainstormIdeaActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const ready = canRunIdeaAi(idea.stage);
  const defaultPreset = presetFromModel(idea.brainstormModel) ?? DEFAULT_BRAINSTORM_PRESET;
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  if (!ready) {
    return (
      <div>
        <span className="ui-btn-secondary w-full cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
          <IconBrainstorm className="h-3.5 w-3.5" />
          ブレスト
        </span>
        {compact ? null : (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {BRAINSTORM_ARCHIVE_ERROR}
          </p>
        )}
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="brainstorm" />
      {compact ? (
        <input type="hidden" name="preset" value={defaultPreset} />
      ) : (
        <>
          <label className="sr-only" htmlFor="brainstorm-preset">
            プリセット
          </label>
          <select
            id="brainstorm-preset"
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
          <IconBrainstorm className="h-3.5 w-3.5" />
        )}
        {pending ? "実行中…" : "ブレスト"}
      </button>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
      {compact ? null : (
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          切り口・別案・次の問いを広げます。既定は標準です。
        </p>
      )}
    </fetcher.Form>
  );
}

export function IdeaBrainstormNotes({ idea, id }: { idea: MockIdea; id?: string }) {
  const preset = presetFromModel(idea.brainstormModel);
  const modelLabel = preset ? RESEARCH_PRESET_LABEL[preset] : idea.brainstormModel;

  return (
    <section id={id} className="mt-6">
      <h3 className="text-[13.5px] font-semibold">ブレスト</h3>
      {idea.brainstormNotes ? (
        <div className="ui-panel mt-2 p-3">
          <p className="font-mono text-[11px] text-muted-foreground">
            {modelLabel}
            {idea.brainstormedAt ? ` · ${formatDateJa(idea.brainstormedAt)}` : ""}
          </p>
          {idea.brainstormModel ? (
            <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
              {idea.brainstormModel}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
            {idea.brainstormNotes}
          </p>
        </div>
      ) : canRunIdeaAi(idea.stage) ? (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          まだ実行していません。上のプリセットから広げられます。
        </p>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          展開はまだありません。{BRAINSTORM_ARCHIVE_ERROR}
        </p>
      )}
    </section>
  );
}
