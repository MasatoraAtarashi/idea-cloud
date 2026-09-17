import { Link } from "react-router";
import type { MockIdea } from "../data/mock";
import { IconMore } from "./icons";

export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const researchReady = idea.stage === "selected";

  return (
    <details className="ui-menu relative" name="idea-actions">
      <summary
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="操作"
      >
        <IconMore className="h-4 w-4" />
      </summary>
      <div className="ui-panel absolute right-0 z-20 mt-1 w-40 py-1">
        <Link
          to={`/app/merge?from=${idea.id}`}
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          融合
        </Link>
        {researchReady ? (
          <Link
            to={`/app/research?from=${idea.id}`}
            className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
          >
            リサーチ
          </Link>
        ) : (
          <span
            className="block cursor-not-allowed px-3 py-1.5 text-[13px] text-muted-foreground"
            title="採用してから"
          >
            リサーチ
          </span>
        )}
      </div>
    </details>
  );
}
