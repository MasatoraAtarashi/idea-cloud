import { Link, useFetcher, useLocation } from "react-router";
import { nextStage, STAGE_LABEL, STAGES, type MockIdea, type Stage } from "../data/mock";
import { confirmIdeaDelete } from "../lib/idea-delete";
import { canRunIdeaAi } from "../lib/idea-ai";
import { LIST_PATH } from "../lib/home-path";
import { useInstantPending } from "../lib/use-instant-pending";
import { isBrainstormSubmitting } from "./idea-brainstorm";
import { isEvaluateSubmitting } from "./idea-evaluate";
import { isResearchSubmitting } from "./idea-research";
import { IdeaCopyButton } from "./idea-copy-button";
import { IconMore, IconSpinner } from "./icons";
import { PopoverMenu } from "./popover-menu";

const itemClass =
  "flex min-h-11 w-full items-center px-3 text-left text-[13px] text-foreground no-underline hover:bg-row-hover md:min-h-9";

export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  const location = useLocation();
  const aiReady = canRunIdeaAi(idea.stage);
  const next = nextStage(idea.stage);
  const intent = fetcher.formData?.get("intent");
  const busy = fetcher.state !== "idle";
  const researchBusy = busy && isResearchSubmitting(fetcher.formData);
  const brainstormBusy = busy && isBrainstormSubmitting(fetcher.formData);
  const evaluateBusy = busy && isEvaluateSubmitting(fetcher.formData);
  const stageBusy = busy && intent === "stage";
  const deleteBusy = busy && intent === "delete";
  const researchPending = useInstantPending(researchBusy);
  const brainstormPending = useInstantPending(brainstormBusy);
  const evaluatePending = useInstantPending(evaluateBusy);
  const stagePending = useInstantPending(stageBusy);
  const deletePending = useInstantPending(deleteBusy);

  function submitIntent(nextIntent: string, extra?: Record<string, string>) {
    const data = new FormData();
    data.set("intent", nextIntent);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) data.set(key, value);
    }
    void fetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  function setStage(stage: Stage) {
    stagePending.hold();
    submitIntent("stage", { stage });
  }

  function deleteIdeaRow() {
    if (!confirmIdeaDelete(idea.title)) return;
    deletePending.hold();
    const here = `${location.pathname}${location.search}`;
    submitIntent("delete", { redirectTo: here.startsWith("/app/ideas/") ? LIST_PATH : here });
  }

  return (
    <PopoverMenu
      label="操作"
      trigger={
        stagePending.pending || deletePending.pending ? (
          <IconSpinner className="h-4 w-4 animate-spin" />
        ) : (
          <IconMore className="h-4 w-4" />
        )
      }
    >
      {(close) => (
        <>
          <Link
            role="menuitem"
            to={`/app/ideas/${idea.id}`}
            prefetch="intent"
            className={itemClass}
            onClick={close}
          >
            詳細を開く
          </Link>
          <Link
            role="menuitem"
            to={`/app/ideas/${idea.id}#discuss`}
            prefetch="intent"
            className={itemClass}
            onClick={close}
          >
            AIと話す
          </Link>
          <IdeaCopyButton idea={idea} menuitem className={itemClass} onDone={close} />
          {next ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setStage(next);
              }}
              className={itemClass}
            >
              次の段階へ（{STAGE_LABEL[next]}）
            </button>
          ) : null}
          {aiReady ? (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={researchPending.pending}
                onClick={() => {
                  researchPending.hold();
                  close();
                  submitIntent("research");
                }}
                className={`${itemClass} gap-1.5 disabled:text-muted-foreground`}
              >
                {researchPending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {researchPending.pending ? "実行中…" : "リサーチを実行"}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={brainstormPending.pending}
                onClick={() => {
                  brainstormPending.hold();
                  close();
                  submitIntent("brainstorm");
                }}
                className={`${itemClass} gap-1.5 disabled:text-muted-foreground`}
              >
                {brainstormPending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {brainstormPending.pending ? "実行中…" : "ブレスト"}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={evaluatePending.pending}
                onClick={() => {
                  evaluatePending.hold();
                  close();
                  submitIntent("evaluate");
                }}
                className={`${itemClass} gap-1.5 disabled:text-muted-foreground`}
              >
                {evaluatePending.pending ? (
                  <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {evaluatePending.pending ? "実行中…" : "AI評価"}
              </button>
            </>
          ) : (
            <p className="cursor-not-allowed px-3 py-2 text-[13px] text-muted-foreground">
              リサーチ / ブレスト / AI評価
              <span className="mt-0.5 block text-[11px] leading-snug">
                アーカイブでは実行できません
              </span>
            </p>
          )}
          <div className="my-1 border-t border-border" />
          <p className="px-3 py-1 font-mono text-[11px] text-muted-foreground">段階を変更</p>
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setStage(stage);
              }}
              className={itemClass}
            >
              {STAGE_LABEL[stage]}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <Link
            role="menuitem"
            to={`/app/merge?from=${idea.id}`}
            className={itemClass}
            onClick={close}
          >
            他のアイデアと融合
          </Link>
          <div className="my-1 border-t border-border" />
          {idea.stage !== "archived" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setStage("archived");
              }}
              className={`${itemClass} text-muted-foreground`}
            >
              アーカイブ
            </button>
          ) : (
            <p className="px-3 py-2 text-[12px] text-muted-foreground">すでにアーカイブです</p>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={deletePending.pending}
            onClick={() => {
              close();
              deleteIdeaRow();
            }}
            className={`${itemClass} text-danger hover:bg-[var(--danger-soft)]`}
          >
            {deletePending.pending ? "削除中…" : "削除"}
          </button>
        </>
      )}
    </PopoverMenu>
  );
}
