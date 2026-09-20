import type { ReactNode } from "react";
import { IdeaBrainstormControls } from "./idea-brainstorm";
import { IdeaEvaluateControls } from "./idea-evaluate";
import { IdeaResearchControls } from "./idea-research";
import type { MockIdea } from "../data/mock";

export function IdeaAiMenu({
  idea,
  researchError,
  brainstormError,
  evaluateError,
  compact = false,
  label = "AI",
  ariaLabel,
  children,
}: {
  idea: MockIdea;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  compact?: boolean;
  label?: ReactNode;
  ariaLabel?: string;
  children?: ReactNode;
}) {
  const summaryLabel = ariaLabel ?? (typeof label === "string" ? label : "操作");
  return (
    <details className="ui-menu relative">
      <summary
        aria-label={summaryLabel}
        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border-control bg-card px-3 text-[13.5px] font-medium md:h-8 md:min-h-8"
      >
        {label}
      </summary>
      <div className="ui-float absolute right-0 z-20 mt-1 w-56 space-y-2 px-3 py-3">
        <IdeaResearchControls idea={idea} error={researchError} compact={compact} />
        <IdeaBrainstormControls idea={idea} error={brainstormError} compact={compact} />
        <IdeaEvaluateControls idea={idea} error={evaluateError} compact={compact} />
        {children ? <div className="space-y-2 border-t border-border pt-2">{children}</div> : null}
      </div>
    </details>
  );
}
