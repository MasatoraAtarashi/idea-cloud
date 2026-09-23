import type { Stage } from "../data/mock";

/** Research and brainstorm may run from 着想 onward; archive stays blocked. */
export function canRunIdeaAi(stage: Stage): boolean {
  return stage !== "archived";
}

export const RESEARCH_ARCHIVE_ERROR = "アーカイブではリサーチできません";
export const BRAINSTORM_ARCHIVE_ERROR = "アーカイブではブレストできません";
export const EVALUATE_ARCHIVE_ERROR = "アーカイブではAI評価できません";
export const DISCUSS_ARCHIVE_ERROR = "アーカイブでは相談できません";
