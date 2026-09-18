import { Form, useNavigation } from "react-router";
import type { MockIdea } from "../data/mock";
import { formatDateJa } from "../lib/format";
import {
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { ResearchIdeaActionData } from "../lib/idea-research-action";
import { IconSearch } from "./icons";

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
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle" && isResearchSubmitting(navigation.formData);
  const researchReady = idea.stage === "selected";
  const defaultPreset = presetFromModel(idea.researchModel) ?? "fast";

  if (!researchReady) {
    return (
      <div>
        <span className="ui-btn-secondary h-9 w-full cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
          <IconSearch className="h-3.5 w-3.5" />
          リサーチを実行
        </span>
        <p id="research-gate" className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          採用で実行できます。下の段階を採用に変えると、プリセット（速い・安い / 標準 /
          じっくり）が使えます。
        </p>
        {error ? <p className="mt-1.5 text-[12.5px] text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <Form method="post" className="flex flex-col gap-1.5">
      <input type="hidden" name="intent" value="research" />
      <label className="sr-only" htmlFor="research-preset">
        プリセット
      </label>
      <select
        id="research-preset"
        name="preset"
        defaultValue={defaultPreset}
        disabled={submitting}
        className="ui-input h-9 text-[13px]"
      >
        {PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {RESEARCH_PRESET_LABEL[preset]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="ui-btn-secondary h-9 w-full justify-start px-3 text-[13px]"
        disabled={submitting}
      >
        <IconSearch className="h-3.5 w-3.5" />
        {submitting ? "実行中…" : "リサーチを実行"}
      </button>
      {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
      <p className="text-[11.5px] leading-snug text-muted-foreground">
        保存した本文だけを分析します。ウェブ検索はありません。
      </p>
    </Form>
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
      ) : idea.stage === "selected" ? (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          まだ実行していません。上のプリセットから実行できます。
        </p>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          調査メモはまだありません。採用で実行できます。
        </p>
      )}
    </section>
  );
}
