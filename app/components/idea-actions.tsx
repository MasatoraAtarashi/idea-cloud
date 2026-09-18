import { useRef } from "react";
import { Link, useFetcher } from "react-router";
import { nextStage, STAGE_LABEL, STAGES, type MockIdea, type Stage } from "../data/mock";
import { canRunIdeaAi } from "../lib/idea-ai";
import { useInstantPending } from "../lib/use-instant-pending";
import { isBrainstormSubmitting } from "./idea-brainstorm";
import { isEvaluateSubmitting } from "./idea-evaluate";
import { isResearchSubmitting } from "./idea-research";
import { IconMore, IconSpinner } from "./icons";

export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const stageFetcher = useFetcher();
  const researchFetcher = useFetcher();
  const brainstormFetcher = useFetcher();
  const evaluateFetcher = useFetcher();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const aiReady = canRunIdeaAi(idea.stage);
  const next = nextStage(idea.stage);
  const researchBusy =
    researchFetcher.state !== "idle" && isResearchSubmitting(researchFetcher.formData);
  const brainstormBusy =
    brainstormFetcher.state !== "idle" && isBrainstormSubmitting(brainstormFetcher.formData);
  const evaluateBusy =
    evaluateFetcher.state !== "idle" && isEvaluateSubmitting(evaluateFetcher.formData);
  const stageBusy = stageFetcher.state !== "idle";
  const researchPending = useInstantPending(researchBusy);
  const brainstormPending = useInstantPending(brainstormBusy);
  const evaluatePending = useInstantPending(evaluateBusy);
  const stagePending = useInstantPending(stageBusy);

  function setStage(stage: Stage) {
    stagePending.hold();
    menuRef.current?.removeAttribute("open");
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", stage);
    void stageFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  function closeMenu() {
    menuRef.current?.removeAttribute("open");
  }

  return (
    <details ref={menuRef} className="ui-menu relative" name="idea-actions">
      <summary
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:h-7 md:w-7"
        aria-label="操作"
      >
        {stagePending.pending ? (
          <IconSpinner className="h-4 w-4 animate-spin" />
        ) : (
          <IconMore className="h-4 w-4" />
        )}
      </summary>
      <div className="ui-float absolute right-0 z-20 mt-1 w-52 py-1">
        <Link
          to={`/app/ideas/${idea.id}`}
          prefetch="intent"
          className="flex min-h-11 items-center px-3 text-[13px] text-foreground no-underline hover:bg-row-hover md:min-h-9"
        >
          詳細を開く
        </Link>
        {next ? (
          <button
            type="button"
            onClick={() => setStage(next)}
            className="flex min-h-11 w-full items-center px-3 text-left text-[13px] text-foreground hover:bg-row-hover md:min-h-9"
          >
            次の段階へ（{STAGE_LABEL[next]}）
          </button>
        ) : null}
        {aiReady ? (
          <>
            <researchFetcher.Form
              method="post"
              action={`/app/ideas/${idea.id}`}
              onSubmit={() => {
                researchPending.hold();
                closeMenu();
              }}
            >
              <input type="hidden" name="intent" value="research" />
              <button
                type="submit"
                disabled={researchPending.pending}
                aria-busy={researchPending.pending}
                className="flex min-h-11 w-full items-center gap-1.5 px-3 text-left text-[13px] text-foreground hover:bg-row-hover disabled:text-muted-foreground md:min-h-9"
              >
                {researchPending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {researchPending.pending ? "実行中…" : "リサーチを実行"}
              </button>
            </researchFetcher.Form>
            <brainstormFetcher.Form
              method="post"
              action={`/app/ideas/${idea.id}`}
              onSubmit={() => {
                brainstormPending.hold();
                closeMenu();
              }}
            >
              <input type="hidden" name="intent" value="brainstorm" />
              <button
                type="submit"
                disabled={brainstormPending.pending}
                aria-busy={brainstormPending.pending}
                className="flex min-h-11 w-full items-center gap-1.5 px-3 text-left text-[13px] text-foreground hover:bg-row-hover disabled:text-muted-foreground md:min-h-9"
              >
                {brainstormPending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {brainstormPending.pending ? "実行中…" : "ブレスト"}
              </button>
            </brainstormFetcher.Form>
            <evaluateFetcher.Form
              method="post"
              action={`/app/ideas/${idea.id}`}
              onSubmit={() => {
                evaluatePending.hold();
                closeMenu();
              }}
            >
              <input type="hidden" name="intent" value="evaluate" />
              <button
                type="submit"
                disabled={evaluatePending.pending}
                aria-busy={evaluatePending.pending}
                className="flex min-h-11 w-full items-center gap-1.5 px-3 text-left text-[13px] text-foreground hover:bg-row-hover disabled:text-muted-foreground md:min-h-9"
              >
                {evaluatePending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {evaluatePending.pending ? "実行中…" : "AI評価"}
              </button>
            </evaluateFetcher.Form>
          </>
        ) : (
          <p className="cursor-not-allowed px-3 py-2 text-[13px] text-muted-foreground">
            リサーチ / ブレスト / AI評価
            <span className="mt-0.5 block text-[11px] leading-snug">
              アーカイブでは実行できません
            </span>
          </p>
        )}
        <div className="border-t border-border my-1" />
        <p className="px-3 py-1 font-mono text-[11px] text-muted-foreground">段階を変更</p>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStage(stage)}
            className="flex min-h-11 w-full items-center px-3 text-left text-[13px] text-foreground hover:bg-row-hover md:min-h-9"
          >
            {STAGE_LABEL[stage]}
          </button>
        ))}
        <div className="border-t border-border my-1" />
        <Link
          to={`/app/merge?from=${idea.id}`}
          className="flex min-h-11 items-center px-3 text-[13px] text-foreground no-underline hover:bg-row-hover md:min-h-9"
        >
          他のアイデアと融合
        </Link>
        <div className="border-t border-border my-1" />
        {idea.stage !== "archived" ? (
          <button
            type="button"
            onClick={() => setStage("archived")}
            className="flex min-h-11 w-full items-center px-3 text-left text-[13px] text-muted-foreground hover:bg-row-hover md:min-h-9"
          >
            アーカイブ
          </button>
        ) : (
          <p className="px-3 py-2 text-[12px] text-muted-foreground">すでにアーカイブです</p>
        )}
      </div>
    </details>
  );
}
