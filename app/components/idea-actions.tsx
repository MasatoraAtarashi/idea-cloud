import { Link, useFetcher } from "react-router";
import { STAGE_LABEL, STAGES, type MockIdea, type Stage } from "../data/mock";
import { LIST_PATH } from "../lib/home-path";
import { IconMore } from "./icons";

export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  const researchReady = idea.stage === "selected";

  function setStage(stage: Stage) {
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", stage);
    data.set("redirectTo", LIST_PATH);
    void fetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  return (
    <details className="ui-menu relative" name="idea-actions">
      <summary
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="操作"
      >
        <IconMore className="h-4 w-4" />
      </summary>
      <div className="ui-float absolute right-0 z-20 mt-1 w-52 py-1">
        <Link
          to={`/app/ideas/${idea.id}`}
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          詳細を開く
        </Link>
        <div className="border-t border-border my-1" />
        <p className="px-3 py-1 font-mono text-[11px] text-muted-foreground">段階を変更</p>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStage(stage)}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-row-hover"
          >
            {STAGE_LABEL[stage]}
          </button>
        ))}
        <div className="border-t border-border my-1" />
        <Link
          to={`/app/merge?from=${idea.id}`}
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          他のアイデアと融合
        </Link>
        {researchReady ? (
          <Link
            to={`/app/ideas/${idea.id}#research`}
            className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
          >
            リサーチを実行
          </Link>
        ) : (
          <span
            className="block cursor-not-allowed px-3 py-1.5 text-[13px] text-muted-foreground"
            title="採用してから"
          >
            リサーチを実行
          </span>
        )}
        <div className="border-t border-border my-1" />
        <button
          type="button"
          onClick={() => setStage("archived")}
          className="block w-full px-3 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-row-hover"
        >
          アーカイブへ移す
        </button>
      </div>
    </details>
  );
}
