import { Form, Link, useNavigation } from "react-router";
import type { MockIdea } from "../data/mock";
import {
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { ResearchIdeaActionData } from "../lib/idea-research-action";
import { IconSearch } from "./icons";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function IdeaResearchSection({
  idea,
  error,
  compact = false,
}: {
  idea: MockIdea;
  error?: ResearchIdeaActionData["error"];
  compact?: boolean;
}) {
  const navigation = useNavigation();
  const submitting =
    navigation.state !== "idle" && navigation.formData?.get("intent") === "research";
  const researchReady = idea.stage === "selected";
  const defaultPreset = presetFromModel(idea.researchModel) ?? "fast";

  return (
    <section className={compact ? "" : "mt-8"}>
      {compact ? null : <h2 className="text-[16px] font-medium tracking-tight">リサーチ</h2>}
      {researchReady ? (
        <Form
          method="post"
          className={compact ? "space-y-2" : "mt-3 flex flex-wrap items-center gap-2"}
        >
          <input type="hidden" name="intent" value="research" />
          <label className="sr-only" htmlFor="research-preset">
            プリセット
          </label>
          <select
            id="research-preset"
            name="preset"
            defaultValue={defaultPreset}
            className="ui-input w-full"
          >
            {PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {RESEARCH_PRESET_LABEL[preset]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="ui-btn-secondary w-full justify-start"
            disabled={submitting}
          >
            <IconSearch className="h-3.5 w-3.5" />
            {submitting ? "実行中…" : "リサーチを実行"}
          </button>
        </Form>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">採用してからリサーチできます。</p>
      )}
      {error ? <p className="mt-2 text-[12.5px] text-muted-foreground">{error}</p> : null}
      {compact ? (
        idea.researchNotes ? (
          <p className="mt-3 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
            {idea.researchNotes}
          </p>
        ) : null
      ) : (
        <div className="ui-panel mt-3 p-4">
          {idea.researchNotes ? (
            <>
              <p className="font-mono text-[11.5px] text-muted-foreground">
                {idea.researchModel}
                {idea.researchedAt ? ` · ${idea.researchedAt}` : ""}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                {idea.researchNotes}
              </p>
            </>
          ) : (
            <p className="text-[13.5px] text-muted-foreground">調査メモはまだありません。</p>
          )}
        </div>
      )}
    </section>
  );
}
