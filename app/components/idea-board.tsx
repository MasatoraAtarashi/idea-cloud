import type { ReactNode } from "react";
import { Link } from "react-router";
import { STAGES, type MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { usePeekLink } from "../lib/idea-peek";
import { compactAgedDays, compactRelative } from "../lib/list-format";
import { IdeaActionsMenu } from "./idea-actions";
import { IdeaReviewPrompt } from "./idea-review";
import { CountBadge, StagePill, TagList } from "./ui";
import { ListAiScore, ListCommentCount } from "./list-meta";

/** The card body is the peek trigger; the href keeps ⌘-click going to detail. */
function BoardCardLink({ idea, children }: { idea: MockIdea; children: ReactNode }) {
  const peek = usePeekLink(idea.id);
  return (
    <Link
      to={`/app/ideas/${idea.id}`}
      prefetch="intent"
      {...peek}
      className="min-w-0 flex-1 no-underline"
    >
      {children}
    </Link>
  );
}

export function IdeaBoard({
  ideas,
  showReview = false,
}: {
  ideas: MockIdea[];
  showReview?: boolean;
}) {
  const t = useT();
  return (
    <div className="flex min-h-0 flex-1 gap-3.5 overflow-x-auto overflow-y-hidden px-7 py-[22px]">
      {STAGES.map((stage) => {
        const cards = ideas.filter((idea) => idea.stage === stage);
        return (
          <section
            key={stage}
            className="flex w-72 shrink-0 flex-col self-stretch rounded-[10px] border border-border-card bg-sunken"
          >
            <header className="shrink-0 border-b border-border px-3 py-2.5">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold">
                <StagePill stage={stage} />
                <CountBadge value={cards.length} />
              </h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {t.common.stageHint[stage]}
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {cards.length === 0 ? (
                <p className="rounded-[8px] border border-dashed border-border-control bg-card px-2 py-6 text-center text-[11.5px] text-muted-foreground">
                  {t.list.boardEmpty}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {cards.map((idea) => (
                    <div
                      key={idea.id}
                      className="rounded-[10px] border border-border-card bg-card px-3 py-2.5 hover:border-border-control hover:shadow-[var(--shadow-hover)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <BoardCardLink idea={idea}>
                          <p className="idea-title-wrap ui-title line-clamp-3 text-[13.5px] leading-[1.5] text-foreground">
                            {idea.title}
                          </p>
                          <div className="mt-1.5">
                            <TagList tags={idea.tags} limit={2} emptyLabel="" />
                          </div>
                          <p className="mt-1.5 flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground">
                            <ListAiScore score={idea.aiScore} />
                            <ListCommentCount count={idea.commentCount} />
                            <span>{compactAgedDays(t, idea.agedDays)}</span>
                            <span>{compactRelative(t, idea.updatedAt)}</span>
                          </p>
                          {showReview ? <IdeaReviewPrompt idea={idea} compact /> : null}
                        </BoardCardLink>
                        <IdeaActionsMenu idea={idea} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
