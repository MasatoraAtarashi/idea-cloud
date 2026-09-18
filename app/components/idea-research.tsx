import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { canRunIdeaAi, RESEARCH_ARCHIVE_ERROR } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { ResearchIdeaActionData } from "../lib/idea-research-action";
import { IconSearch, IconSpinner } from "./icons";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function isResearchSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "research";
}

export function IdeaResearchControls({
  idea,
  error,
}: {
  idea: MockIdea;
  error?: ResearchIdeaActionData["error"];
}) {
  const fetcher = useFetcher<ResearchIdeaActionData>();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const researchReady = canRunIdeaAi(idea.stage);
  const defaultPreset = presetFromModel(idea.researchModel) ?? "fast";
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;

  if (!researchReady) {
    return (
      <div>
        <span className="ui-btn-secondary w-full cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
          <IconSearch className="h-3.5 w-3.5" />
          リサーチを実行
        </span>
        <p id="research-gate" className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {RESEARCH_ARCHIVE_ERROR}
        </p>
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="research" />
      <label className="sr-only" htmlFor="research-preset">
        プリセット
      </label>
      <select
        id="research-preset"
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
      <button
        type="submit"
        className="ui-btn-secondary w-full justify-start px-3 text-[13px]"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <IconSpinner className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <IconSearch className="h-3.5 w-3.5" />
        )}
        {pending ? "実行中…" : "リサーチを実行"}
      </button>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
      <p className="text-[11.5px] leading-snug text-muted-foreground">
        着想から実行できます。保存した本文だけを分析します。ウェブ検索はありません。
      </p>
    </fetcher.Form>
  );
}

export function IdeaResearchNotes({ idea }: { idea: MockIdea }) {
  const preset = presetFromModel(idea.researchModel);
  const modelLabel = preset ? RESEARCH_PRESET_LABEL[preset] : idea.researchModel;

  return (
    <section className="mt-6">
      <h3 className="text-[13.5px] font-medium">リサーチ</h3>
      {idea.researchNotes ? (
        <div className="ui-panel mt-2 p-3">
          <p className="font-mono text-[11px] text-muted-foreground">
            {modelLabel}
            {idea.researchedAt ? ` · ${formatDateJa(idea.researchedAt)}` : ""}
          </p>
          {idea.researchModel ? (
            <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
              {idea.researchModel}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
            {idea.researchNotes}
          </p>
        </div>
      ) : canRunIdeaAi(idea.stage) ? (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          まだ実行していません。上のプリセットから実行できます。
        </p>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          調査メモはまだありません。{RESEARCH_ARCHIVE_ERROR}
        </p>
      )}
    </section>
  );
}
