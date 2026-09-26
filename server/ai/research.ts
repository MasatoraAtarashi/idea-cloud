import {
  extractAiText,
  resolveResearchModel,
  type ResearchModelId,
} from "../../app/lib/research-models";
import {
  buildSearchQuery,
  formatResearchUserText,
  serializeResearchSources,
  type ResearchSources,
} from "../../app/lib/research-sources";
import { canRunIdeaAi, RESEARCH_ARCHIVE_ERROR } from "../../app/lib/idea-ai";
import { asStage, getIdeaRow, saveIdeaResearch, type Idea } from "../../db/ideas";
import type { Db } from "../../db/client";
import { errorClass, logDiag } from "../diag";
import { searchApiKeyFromEnv, searchWebSources } from "./web-search";
import { writeInLanguage } from "./language";
import { aiFailure, type AiFailure } from "./errors";
import type { Locale } from "../../app/i18n/locale";

export const RESEARCH_FAIL_MESSAGE = "リサーチに失敗しました。時間をおいて再度お試しください。";

/** Research notes are displayed as stored, so the whole note follows the reader. */
export function researchSystemPrompt(locale?: Locale): string {
  return [
    "あなたはアイデアのリサーチ助手です。",
    "与えられたアイデア本文とウェブ検索結果だけを読み、短く箇条書きにしてください。",
    "見出しは「観点」「リスク」「次の一手」にあたる3つ。前置きや締めの文は不要です。",
    "検索結果に含まれるタイトルとURL以外の出典を作ってはいけません。URLが無いときはURLを書かないでください。",
    writeInLanguage(locale),
  ].join("");
}

/** Japanese wording, kept for the tests and callers that pin it. */
export const RESEARCH_SYSTEM_PROMPT = researchSystemPrompt("ja");

export type ResearchAiInputs = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  max_tokens?: number;
};

/** Minimal run() shape so tests can stub Workers AI without calling the binding. */
export type ResearchAiRun = (model: ResearchModelId, inputs: ResearchAiInputs) => Promise<unknown>;

export type ResearchAi = {
  run: ResearchAiRun;
};

let testAiRun: ResearchAiRun | undefined;

/** Test-only. Production always uses env.AI via the wrapper below. */
export function setTestAiRun(run?: ResearchAiRun) {
  testAiRun = run;
}

export function bindResearchAi(ai: Env["AI"] | undefined): ResearchAi {
  return {
    async run(model, inputs) {
      if (!ai) {
        throw new Error("Workers AI binding is missing");
      }
      // Fast 8B fp8 is allowlisted but not always in generated AiModelList.
      return (ai as unknown as ResearchAi).run(model, inputs);
    },
  };
}

export function resolveAiRun(ai: ResearchAi): ResearchAiRun {
  return testAiRun ?? ((model, inputs) => ai.run(model, inputs));
}

export async function generateResearchNotes(
  ai: ResearchAi,
  model: ResearchModelId,
  ideaText: string,
  sources?: ResearchSources | null,
  locale?: Locale,
): Promise<string> {
  const run = resolveAiRun(ai);
  const result = await run(model, {
    messages: [
      { role: "system", content: researchSystemPrompt(locale) },
      { role: "user", content: formatResearchUserText(ideaText, sources) },
    ],
    max_tokens: 512,
  });
  const text = extractAiText(result).trim();
  if (!text) {
    throw new Error("empty research result");
  }
  return text;
}

export type ResearchIdeaResult = { ok: true; idea: Idea } | AiFailure;

export async function researchIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
  searchApiKey?: string | null;
  /** Language the notes are written in. Defaults to Japanese. */
  locale?: Locale;
}): Promise<ResearchIdeaResult> {
  const resolved = resolveResearchModel({ preset: opts.preset, model: opts.model });
  if (!resolved.ok) {
    return aiFailure(400, "badRequest", resolved.error);
  }

  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return aiFailure(404, "notFound", "見つかりません");
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    logDiag("info", "ai research", {
      step: "research",
      outcome: "skipped",
      reason: "archived",
      ideaId: idea.id,
      status: 409,
    });
    return aiFailure(409, "archived", RESEARCH_ARCHIVE_ERROR);
  }

  const hasSearchApiKey = Boolean(opts.searchApiKey?.trim());
  logDiag("info", "ai research", {
    step: "research",
    outcome: "start",
    ideaId: idea.id,
    model: resolved.model,
    hasSearchApiKey,
  });
  const ideaText = [idea.title, idea.body].filter((part) => part.trim().length > 0).join("\n");
  const query = buildSearchQuery(idea.title, idea.body);
  const sources = await searchWebSources({
    query,
    apiKey: opts.searchApiKey ?? undefined,
  });

  let notes: string;
  try {
    notes = await generateResearchNotes(opts.ai, resolved.model, ideaText, sources, opts.locale);
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "research",
      provider: "workers_ai",
      outcome: "fail",
      ideaId: idea.id,
      model: resolved.model,
      error: errorClass(error),
    });
    return aiFailure(502, "failed", RESEARCH_FAIL_MESSAGE);
  }

  const saved = await saveIdeaResearch(opts.db, idea.id, {
    notes,
    model: resolved.model,
    sources: serializeResearchSources(sources),
  });
  return { ok: true, idea: saved };
}

export { searchApiKeyFromEnv };
