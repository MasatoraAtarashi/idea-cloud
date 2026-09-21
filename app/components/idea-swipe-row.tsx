import { type ReactNode } from "react";
import { useFetcher } from "react-router";
import { nextStage, type MockIdea } from "../data/mock";
import { SWIPE_BUTTON_WIDTH } from "../lib/swipe";
import { useInstantPending } from "../lib/use-instant-pending";
import { SwipeReveal, type SwipeRevealAction } from "./swipe-reveal";

const BUTTON_WIDTH = SWIPE_BUTTON_WIDTH;

export function IdeaSwipeRow({ idea, children }: { idea: MockIdea; children: ReactNode }) {
  const fetcher = useFetcher();
  const next = nextStage(idea.stage);
  const canArchive = idea.stage !== "archived";
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);

  function submitStage(stage: string) {
    hold();
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", stage);
    void fetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  const actions: SwipeRevealAction[] = [];
  if (next) {
    actions.push({
      key: "next",
      label: pending ? "更新中…" : "次の段階へ",
      tone: "accent",
      disabled: pending,
      onClick: () => submitStage(next),
    });
  }
  if (canArchive) {
    actions.push({
      key: "archive",
      label: pending ? "更新中…" : "アーカイブ",
      tone: "danger",
      disabled: pending,
      onClick: () => submitStage("archived"),
    });
  }

  return (
    <SwipeReveal actions={actions} buttonWidth={BUTTON_WIDTH}>
      {children}
    </SwipeReveal>
  );
}
