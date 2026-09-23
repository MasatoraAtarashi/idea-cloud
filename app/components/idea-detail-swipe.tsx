import { useState, type ReactNode } from "react";
import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { canRunIdeaAi } from "../lib/idea-ai";
import { DETAIL_SWIPE_BUTTON_WIDTH } from "../lib/swipe";
import { useInstantPending } from "../lib/use-instant-pending";
import { IdeaBrainstormControls } from "./idea-brainstorm";
import { IdeaEvaluateControls } from "./idea-evaluate";
import { IdeaResearchControls } from "./idea-research";
import { SwipeReveal, type SwipeRevealAction } from "./swipe-reveal";

export function IdeaDetailSwipe({
  idea,
  editing,
  onEdit,
  researchError,
  brainstormError,
  evaluateError,
  children,
}: {
  idea: MockIdea;
  editing: boolean;
  onEdit: () => void;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  children: ReactNode;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const archiveFetcher = useFetcher();
  const busy = archiveFetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const aiReady = canRunIdeaAi(idea.stage);
  const canArchive = idea.stage !== "archived";

  const actions: SwipeRevealAction[] = [
    {
      key: "edit",
      label: editing ? "閉じる" : "編集",
      tone: "accent",
      onClick: () => {
        setAiOpen(false);
        onEdit();
      },
    },
    {
      key: "ai",
      label: "AI",
      onClick: () => setAiOpen((open) => !open),
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
        setAiOpen(false);
      },
    });
  }

  return (
    <div className="lg:contents">
      <SwipeReveal actions={actions} buttonWidth={DETAIL_SWIPE_BUTTON_WIDTH} hideFrom="lg">
        {children}
      </SwipeReveal>
      {aiOpen ? (
        <div className="mt-3 space-y-2 rounded-[10px] border border-border bg-card px-3 py-3 lg:hidden">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <p className="text-[13.5px] font-semibold">AI</p>
            <button
              type="button"
              onClick={() => setAiOpen(false)}
              className="flex min-h-11 items-center px-3 text-[13.5px] text-muted-foreground"
            >
              閉じる
            </button>
          </div>
          {aiReady ? null : (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              アーカイブでは実行できません
            </p>
          )}
          <IdeaResearchControls idea={idea} error={researchError} compact />
          <IdeaBrainstormControls idea={idea} error={brainstormError} compact />
          <IdeaEvaluateControls idea={idea} error={evaluateError} compact />
        </div>
      ) : null}
    </div>
  );
}
