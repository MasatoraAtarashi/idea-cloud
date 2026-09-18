import { IdeaBrainstormControls } from "./idea-brainstorm";
import { IdeaEvaluateControls } from "./idea-evaluate";
import { IdeaResearchControls } from "./idea-research";
import type { MockIdea } from "../data/mock";

export function IdeaAiMenu({
  idea,
  researchError,
  brainstormError,
  evaluateError,
}: {
  idea: MockIdea;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
}) {
  return (
    <details className="ui-menu rounded-md border border-border-control bg-card">
      <summary className="flex min-h-11 cursor-pointer items-center justify-center px-3 text-[13.5px] font-medium md:h-8 md:min-h-8">
        AI
      </summary>
      <div className="space-y-3 border-t border-border px-3 py-3">
        <IdeaResearchControls idea={idea} error={researchError} />
        <IdeaBrainstormControls idea={idea} error={brainstormError} />
        <IdeaEvaluateControls idea={idea} error={evaluateError} />
      </div>
    </details>
  );
}
