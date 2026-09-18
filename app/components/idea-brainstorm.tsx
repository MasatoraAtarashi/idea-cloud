import { Form, useNavigation } from "react-router";
import type { MockIdea } from "../data/mock";
import { BRAINSTORM_ARCHIVE_ERROR, canRunIdeaAi } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import {
  DEFAULT_BRAINSTORM_PRESET,
  RESEARCH_PRESET_LABEL,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import type { BrainstormIdeaActionData } from "../lib/idea-brainstorm-action";
import { IconBrainstorm } from "./icons";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

export function isBrainstormSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "brainstorm";
}

export function IdeaBrainstormControls({
  idea,
  error,
}: {
  idea: MockIdea;
  error?: BrainstormIdeaActionData["error"];
}) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle" && isBrainstormSubmitting(navigation.formData);
  const ready = canRunIdeaAi(idea.stage);
  const defaultPreset = presetFromModel(idea.brainstormModel) ?? DEFAULT_BRAINSTORM_PRESET;

  if (!ready) {
    return (
      <div>
        <span className="ui-btn-secondary h-9 w-full cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
          <IconBrainstorm className="h-3.5 w-3.5" />
          ブレスト
        </span>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {BRAINSTORM_ARCHIVE_ERROR}
        </p>
        {error ? <p className="mt-1.5 text-[12.5px] text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <Form method="post" className="flex flex-col gap-1.5">
      <input type="hidden" name="intent" value="brainstorm" />
      <label className="sr-only" htmlFor="brainstorm-preset">
        プリセット
      </label>
      <select
        id="brainstorm-preset"
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
        <IconBrainstorm className="h-3.5 w-3.5" />
        {submitting ? "実行中…" : "ブレスト"}
      </button>
      {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
      <p className="text-[11.5px] leading-snug text-muted-foreground">
        切り口・別案・次の問いを広げます。既定は標準です。
      </p>
    </Form>
  );
}

export function IdeaBrainstormNotes({ idea }: { idea: MockIdea }) {
  const preset = presetFromModel(idea.brainstormModel);
  const modelLabel = preset ? RESEARCH_PRESET_LABEL[preset] : idea.brainstormModel;

  return (
    <section id="brainstorm" className="mt-6">
      <h3 className="text-[13.5px] font-medium">ブレスト</h3>
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
