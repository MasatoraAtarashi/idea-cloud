import { useFetcher, useLocation } from "react-router";
import { nextStage, type MockIdea, type Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { confirmIdeaDelete } from "../lib/idea-delete";
import { LIST_PATH } from "../lib/home-path";
import { useInstantPending } from "../lib/use-instant-pending";
import { IdeaCopyButton } from "./idea-copy-button";
import { IconMore, IconSpinner } from "./icons";
import { PopoverMenu } from "./popover-menu";

const itemClass =
  "flex min-h-11 w-full items-center px-3 text-left text-[13px] text-secondary no-underline hover:bg-sunken hover:text-foreground md:min-h-9";

/** Row `⋯`. AI runs live on the detail page only, so none of them are here. */
export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const t = useT();
  const fetcher = useFetcher();
  const location = useLocation();
  const next = nextStage(idea.stage);
  const intent = fetcher.formData?.get("intent");
  const busy = fetcher.state !== "idle";
  const stagePending = useInstantPending(busy && intent === "stage");
  const deletePending = useInstantPending(busy && intent === "delete");

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
    if (!confirmIdeaDelete(t, idea.title)) return;
    deletePending.hold();
    const here = `${location.pathname}${location.search}`;
    submitIntent("delete", { redirectTo: here.startsWith("/app/ideas/") ? LIST_PATH : here });
  }

  return (
    <PopoverMenu
      label={t.idea.actions.menuLabel}
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
              {t.idea.nextStageTo(t.common.stage[next])}
            </button>
          ) : null}
          <IdeaCopyButton idea={idea} menuitem className={itemClass} onDone={close} />
          {idea.stage !== "archived" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setStage("archived");
              }}
              className={itemClass}
            >
              {t.idea.archive}
            </button>
          ) : null}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            disabled={deletePending.pending}
            onClick={() => {
              close();
              deleteIdeaRow();
            }}
            className={`${itemClass} text-danger hover:bg-[var(--danger-soft)] hover:text-danger`}
          >
            {deletePending.pending ? t.idea.actions.deleting : t.idea.actions.delete}
          </button>
        </>
      )}
    </PopoverMenu>
  );
}
