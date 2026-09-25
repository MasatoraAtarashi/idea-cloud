import type { Dictionary } from "../i18n/dictionary";
import { JEV_MODEL, JEV_MODEL_LABEL } from "./jev";

export const RESEARCH_PRESETS = {
  fast: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
  standard: "@cf/qwen/qwen3-30b-a3b-fp8",
  deep: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
} as const;

export type ResearchPreset = keyof typeof RESEARCH_PRESETS;
export type ResearchModelId = (typeof RESEARCH_PRESETS)[ResearchPreset];

/** UI copy for a preset. The model id behind it is never translated. */
export function researchPresetLabel(t: Dictionary, preset: ResearchPreset): string {
  return t.ai.preset[preset];
}

export const DEFAULT_RESEARCH_PRESET: ResearchPreset = "fast";
export const DEFAULT_BRAINSTORM_PRESET: ResearchPreset = "standard";
export const DEFAULT_EVALUATE_PRESET: ResearchPreset = "standard";
export const DEFAULT_DISCUSS_PRESET: ResearchPreset = "standard";

const ALLOWED_MODELS = new Set<string>(Object.values(RESEARCH_PRESETS));

export function isResearchPreset(value: string): value is ResearchPreset {
  return Object.hasOwn(RESEARCH_PRESETS, value);
}

export function isResearchModelId(value: string): value is ResearchModelId {
  return ALLOWED_MODELS.has(value);
}

export function evaluationModelLabel(t: Dictionary, model: string | null | undefined): string {
  if (!model) return "";
  if (model === JEV_MODEL) return JEV_MODEL_LABEL;
  const preset = presetFromModel(model);
  return preset ? researchPresetLabel(t, preset) : model;
}

export function presetFromModel(model: string | null | undefined): ResearchPreset | undefined {
  if (!model) return undefined;
  for (const [preset, id] of Object.entries(RESEARCH_PRESETS) as [
    ResearchPreset,
    ResearchModelId,
  ][]) {
    if (id === model) return preset;
  }
  return undefined;
}

export function resolveResearchModel(input: {
  preset?: string | null;
  model?: string | null;
  defaultPreset?: ResearchPreset;
}): { ok: true; preset: ResearchPreset; model: ResearchModelId } | { ok: false; error: string } {
  const fallback = input.defaultPreset ?? DEFAULT_RESEARCH_PRESET;
  const rawModel = input.model?.trim() ?? "";
  if (rawModel) {
    if (!isResearchModelId(rawModel)) {
      return { ok: false, error: "model は許可されていません" };
    }
    return {
      ok: true,
      preset: presetFromModel(rawModel) ?? fallback,
      model: rawModel,
    };
  }
  const presetRaw = input.preset?.trim() || fallback;
  if (!isResearchPreset(presetRaw)) {
    return { ok: false, error: "preset が不正です" };
  }
  return { ok: true, preset: presetRaw, model: RESEARCH_PRESETS[presetRaw] };
}

export function extractAiText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, unknown>;
  if (typeof record.response === "string") return record.response;
  if (typeof record.text === "string") return record.text;
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (first && typeof first === "object") {
      const choice = first as Record<string, unknown>;
      if (typeof choice.text === "string") return choice.text;
      const message = choice.message;
      if (message && typeof message === "object") {
        const content = (message as Record<string, unknown>).content;
        if (typeof content === "string") return content;
      }
    }
  }
  return "";
}

/**
 * Workers AI reports how a generation ended. Returns true when the model was cut
 * off by max_tokens rather than finishing its own sentence.
 */
export function isAiTruncated(result: unknown, maxTokens: number): boolean {
  if (!result || typeof result !== "object") return false;
  const record = result as Record<string, unknown>;
  const reason = findFinishReason(record);
  if (reason) return reason === "length";
  const usage = record.usage;
  if (usage && typeof usage === "object") {
    const completion = (usage as Record<string, unknown>).completion_tokens;
    if (typeof completion === "number") return completion >= maxTokens;
  }
  return false;
}

function findFinishReason(record: Record<string, unknown>): string | undefined {
  if (typeof record.finish_reason === "string") return record.finish_reason;
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (first && typeof first === "object") {
      const reason = (first as Record<string, unknown>).finish_reason;
      if (typeof reason === "string") return reason;
    }
  }
  return undefined;
}
