import { Form, useNavigation } from "react-router";
import type { MockIdea } from "../data/mock";
import {
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { ResearchIdeaActionData } from "../lib/idea-research-action";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function IdeaResearchSection({
  idea,
  error,
}: {
  idea: MockIdea;
  error?: ResearchIdeaActionData["error"];
}) {
  const navigation = useNavigation();
  const submitting =
    navigation.state !== "idle" && navigation.formData?.get("intent") === "research";
  const researchReady = idea.stage === "selected";
  const defaultPreset = presetFromModel(idea.researchModel) ?? "fast";

  return (
    <section id="research" className="mt-8">
      <h2 className="text-[15px] font-medium tracking-tight">リサーチ</h2>
      {researchReady ? (
        <Form method="post" className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="intent" value="research" />
          <label className="sr-only" htmlFor="research-preset">
            プリセット
          </label>
          <select
            id="research-preset"
            name="preset"
            defaultValue={defaultPreset}
            className="ui-input w-auto min-w-40"
          >
            {PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {RESEARCH_PRESET_LABEL[preset]}
              </option>
            ))}
          </select>
          <button type="submit" className="ui-btn" disabled={submitting}>
            {submitting ? "実行中…" : "実行"}
          </button>
        </Form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">採用してからリサーチできます。</p>
      )}
      {error ? <p className="mt-2 text-sm text-muted-foreground">{error}</p> : null}
      <div className="ui-panel mt-3 p-4">
        {idea.researchNotes ? (
          <>
            <p className="text-xs text-muted-foreground">
              {idea.researchModel}
              {idea.researchedAt ? ` · ${idea.researchedAt}` : ""}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
              {idea.researchNotes}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">調査メモはまだありません。</p>
        )}
      </div>
    </section>
  );
}
