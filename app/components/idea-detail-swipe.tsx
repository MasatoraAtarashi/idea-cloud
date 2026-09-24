import type { ReactNode } from "react";
import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { DETAIL_SWIPE_BUTTON_WIDTH } from "../lib/swipe";
import { useInstantPending } from "../lib/use-instant-pending";
import { SwipeReveal, type SwipeRevealAction } from "./swipe-reveal";

/** Mobile detail body: swipe for 編集 / AI 作業台 / 融合 / アーカイブ. */
export function IdeaDetailSwipe({
  idea,
  editing,
  onEdit,
  onAi,
  children,
}: {
  idea: MockIdea;
  editing: boolean;
  onEdit: () => void;
  /** Switches the mobile segment to the AI 作業台. */
  onAi: () => void;
  children: ReactNode;
}) {
  const archiveFetcher = useFetcher();
  const busy = archiveFetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const canArchive = idea.stage !== "archived";

  const actions: SwipeRevealAction[] = [
    {
      key: "edit",
      label: editing ? "閉じる" : "編集",
      tone: "accent",
      onClick: onEdit,
    },
    {
      key: "ai",
      label: "AI",
      onClick: onAi,
    },
    {
      key: "merge",
      label: "融合",
      href: `/app/merge?from=${idea.id}`,
    },
  ];
  if (canArchive) {
    actions.push({
      key: "archive",
      label: pending ? "更新中…" : "アーカイブ",
      tone: "danger",
      disabled: pending,
      onClick: () => {
        hold();
        const data = new FormData();
        data.set("intent", "stage");
        data.set("stage", "archived");
        void archiveFetcher.submit(data, {
          method: "post",
          action: `/app/ideas/${idea.id}`,
        });
      },
    });
  }

  return (
    <SwipeReveal actions={actions} buttonWidth={DETAIL_SWIPE_BUTTON_WIDTH} hideFrom="lg">
      <div className="bg-card">{children}</div>
    </SwipeReveal>
  );
}
