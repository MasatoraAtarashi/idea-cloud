import { extractAiText, RESEARCH_PRESETS } from "../../app/lib/research-models";
import type { ResearchAi, ResearchAiRun } from "./research";

/** Fast/cheap model already used for research 「速い・安い」. */
export const AUTO_TAG_MODEL = RESEARCH_PRESETS.fast;

export const AUTO_TAG_MAX = 5;
export const USER_TAG_MAX = 8;
const TAG_MAX_LEN = 20;

export const AUTO_TAG_SYSTEM_PROMPT = [
  "あなたはアイデアに付ける短い日本語タグを提案します。",
  "タイトルと本文から、2〜5個の短い名詞タグだけをJSON配列で返してください。",
  '例: ["通勤","音声メモ","朝"]',
  "説明・番号・英語の長文は不要です。",
].join("");

let testTagAiRun: ResearchAiRun | undefined;

/** Test-only. Production always uses env.AI via bindResearchAi. */
export function setTestTagAiRun(run?: ResearchAiRun) {
  testTagAiRun = run;
}

export function sanitizeTags(raw: unknown[], max = USER_TAG_MAX): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const tag = item.replace(/^#+/, "").trim();
    if (tag.length < 1 || tag.length > TAG_MAX_LEN) continue;
    if (/[\n\r]/.test(tag)) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

function extractJsonValue(text: string): string | undefined {
  const arrayStart = text.indexOf("[");
  const objectStart = text.indexOf("{");
  if (arrayStart < 0 && objectStart < 0) return undefined;
  const start =
    arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart) ? arrayStart : objectStart;
  const closer = text[start] === "[" ? "]" : "}";
  const end = text.lastIndexOf(closer);
  if (end <= start) return undefined;
  return text.slice(start, end + 1);
}

export function parseTagSuggestions(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];

  const jsonSlice = extractJsonValue(text);
  if (jsonSlice) {
    try {
      const parsed = JSON.parse(jsonSlice) as unknown;
      if (Array.isArray(parsed)) return sanitizeTags(parsed, AUTO_TAG_MAX);
      if (parsed && typeof parsed === "object") {
        const tags = (parsed as { tags?: unknown }).tags;
        if (Array.isArray(tags)) return sanitizeTags(tags, AUTO_TAG_MAX);
      }
    } catch {
      // fall through to loose split
    }
  }

  return sanitizeTags(text.split(/[,、/｜|;\n]/), AUTO_TAG_MAX);
}

export async function suggestIdeaTags(ai: ResearchAi, text: string): Promise<string[]> {
  const ideaText = text.trim();
  if (!ideaText) return [];
  try {
    const run = testTagAiRun ?? ((model, inputs) => ai.run(model, inputs));
    const result = await run(AUTO_TAG_MODEL, {
      messages: [
        { role: "system", content: AUTO_TAG_SYSTEM_PROMPT },
        { role: "user", content: ideaText },
      ],
      max_tokens: 96,
    });
    return parseTagSuggestions(extractAiText(result));
  } catch {
    return [];
  }
}

/** Keep user tags when present; otherwise ask Workers AI and fail soft to []. */
export async function resolveCreateTags(opts: {
  ai: ResearchAi;
  text: string;
  tags: string[];
}): Promise<string[]> {
  const provided = sanitizeTags(opts.tags, USER_TAG_MAX);
  if (provided.length > 0) return provided;
  return suggestIdeaTags(opts.ai, opts.text);
}
