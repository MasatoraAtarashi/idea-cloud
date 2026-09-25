import type { Stage } from "../data/mock";

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
