import { extractAiText, RESEARCH_PRESETS } from "../../app/lib/research-models";
import { errorClass, logDiag } from "../diag";
import { suggestIdeaTagsWithJev } from "./jev-tags";
import type { ResearchAi, ResearchAiRun } from "./research";
import { hasTypesafeApiKey } from "./typesafe";
import { languageName } from "./language";
import type { Locale } from "../../app/i18n/locale";

/** Fast/cheap model already used for research 「速い・安い」. */
export const AUTO_TAG_MODEL = RESEARCH_PRESETS.fast;

export const AUTO_TAG_MAX = 5;
export const USER_TAG_MAX = 8;
const TAG_MAX_LEN = 20;

/** Tags are shown as stored, so they are written in the language of whoever created the idea. */
export function autoTagSystemPrompt(locale?: Locale): string {
  return [
    `あなたはアイデアに付ける短い${languageName(locale)}のタグを提案します。`,
    "タイトルと本文から、2〜5個の短い名詞タグだけをJSON配列で返してください。",
    '例: ["通勤","音声メモ","朝"]（この例は形式の見本で、言語は上の指定に従ってください）',
    "説明や番号は不要です。",
  ].join("");
}

/** Japanese wording, kept for the tests and callers that pin it. */
export const AUTO_TAG_SYSTEM_PROMPT = autoTagSystemPrompt("ja");

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

export async function suggestIdeaTags(
  ai: ResearchAi,
  text: string,
  locale?: Locale,
): Promise<string[]> {
  const ideaText = text.trim();
  if (!ideaText) return [];
  try {
    const run = testTagAiRun ?? ((model, inputs) => ai.run(model, inputs));
    const result = await run(AUTO_TAG_MODEL, {
      messages: [
        { role: "system", content: autoTagSystemPrompt(locale) },
        { role: "user", content: ideaText },
      ],
      max_tokens: 96,
    });
    return parseTagSuggestions(extractAiText(result));
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "tags",
      provider: "workers_ai",
      outcome: "fail",
      model: AUTO_TAG_MODEL,
      error: errorClass(error),
    });
    return [];
  }
}

/** Keep user tags when present; otherwise prefer Jev, then Workers AI, fail soft to []. */
export async function resolveCreateTags(opts: {
  ai: ResearchAi;
  text: string;
  tags: string[];
  typesafeApiKey?: string;
  /** Language the generated tags are written in. Defaults to Japanese. */
  locale?: Locale;
}): Promise<string[]> {
  const hasTypesafeKey = Boolean(opts.typesafeApiKey?.trim());
  const provided = sanitizeTags(opts.tags, USER_TAG_MAX);
  if (provided.length > 0) {
    logDiag("info", "create auto-tag", {
      step: "tags",
      outcome: "skipped",
      reason: "user_tags",
      count: provided.length,
      hasTypesafeApiKey: hasTypesafeKey,
    });
    return provided;
  }
  if (hasTypesafeApiKey(opts.typesafeApiKey)) {
    try {
      const jevTags = sanitizeTags(
        await suggestIdeaTagsWithJev(opts.typesafeApiKey, opts.text),
        AUTO_TAG_MAX,
      );
      if (jevTags.length > 0) {
        logDiag("info", "create auto-tag", {
          step: "tags",
          outcome: "success",
          provider: "jev",
          count: jevTags.length,
          hasTypesafeApiKey: hasTypesafeKey,
        });
        return jevTags;
      }
      logDiag("info", "create auto-tag", {
        step: "tags",
        outcome: "fallback",
        reason: "empty",
        provider: "workers_ai",
        hasTypesafeApiKey: hasTypesafeKey,
        count: 0,
      });
    } catch (error) {
      logDiag("warn", "create auto-tag", {
        step: "tags",
        outcome: "fallback",
        reason: "jev_failed",
        provider: "workers_ai",
        hasTypesafeApiKey: hasTypesafeKey,
        error: errorClass(error),
      });
    }
  } else {
    logDiag("info", "create auto-tag", {
      step: "tags",
      outcome: "fallback",
      reason: "missing_key",
      provider: "workers_ai",
      hasTypesafeApiKey: false,
    });
  }
  const tags = await suggestIdeaTags(opts.ai, opts.text, opts.locale);
  if (tags.length === 0) {
    logDiag("warn", "create auto-tag", {
      step: "tags",
      outcome: "fail",
      provider: "workers_ai",
      error: "empty",
      count: 0,
      hasTypesafeApiKey: hasTypesafeKey,
    });
    return tags;
  }
  logDiag("info", "create auto-tag", {
    step: "tags",
    outcome: "success",
    provider: "workers_ai",
    count: tags.length,
    hasTypesafeApiKey: hasTypesafeKey,
  });
  return tags;
}
