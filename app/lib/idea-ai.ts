import type { Stage } from "../data/mock";
import type { Dictionary } from "../i18n/dictionary";
import type { AiErrorCode } from "../../server/ai/errors";

/** Research and brainstorm may run from 着想 onward; archive stays blocked. */
export function canRunIdeaAi(stage: Stage): boolean {
  return stage !== "archived";
}

/**
 * API error bodies, NOT UI copy: server/ai/*.ts returns these verbatim and the
 * HTTP tests pin them. Screens render `t.ai.archive.*` instead.
 */
export const RESEARCH_ARCHIVE_ERROR = "アーカイブではリサーチできません";
export const BRAINSTORM_ARCHIVE_ERROR = "アーカイブではブレストできません";
export const EVALUATE_ARCHIVE_ERROR = "アーカイブではAI評価できません";
export const DISCUSS_ARCHIVE_ERROR = "アーカイブでは相談できません";

/** The four AI runs, for picking the right "archived" / "failed" sentence. */
export type IdeaAiFeature = "research" | "brainstorm" | "evaluate" | "discuss";

/**
 * Turns the server's error code into copy in the reader's language. The
 * server's own `error` string is Japanese and meant for API and MCP callers;
 * screens must never render it directly.
 */
export function aiErrorMessage(t: Dictionary, feature: IdeaAiFeature, code: AiErrorCode): string {
  switch (code) {
    case "notFound":
      return t.ai.notFound;
    case "archived":
      return t.ai.archive[feature];
    case "noRoom":
      return t.ai.failure.noRoom;
    case "badRequest":
      return t.ai.failure.badRequest;
    case "empty":
      return t.ai.failure.empty;
    case "tooLong":
      return t.ai.failure.tooLong;
    case "failed":
      return t.ai.failure[feature];
  }
}
