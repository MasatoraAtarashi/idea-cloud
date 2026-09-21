import { Link } from "react-router";
import { STAGE_HINT, STAGES, type MockIdea } from "../data/mock";
import { formatAgedDays } from "../lib/format";
import { IdeaActionsMenu } from "./idea-actions";
import { ReflectionBadge } from "./idea-reflection";
import { IdeaReviewPrompt, ReviewStatusBadge } from "./idea-review";
import { IdeaScoreChips } from "./idea-score";
import { CountBadge, StagePill, TagList } from "./ui";

export function IdeaBoard({
  ideas,
  showReview = false,
}: {
  ideas: MockIdea[];
  showReview?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4">
      {STAGES.map((stage) => {
        const cards = ideas.filter((idea) => idea.stage === stage);
        return (
          <section
            key={stage}
            className="flex w-72 shrink-0 flex-col self-stretch rounded-lg border border-border bg-muted/40"
          >
            <header className="shrink-0 border-b border-border px-2.5 py-2">
              <h2 className="ui-title flex items-center gap-2 text-[13.5px]">
                <StagePill stage={stage} />
                <CountBadge value={cards.length} />
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {STAGE_HINT[stage]}
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {cards.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-card px-2 py-6 text-center text-[11px] text-muted-foreground">
                  まだありません
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {cards.map((idea) => (
                    <div
                      key={idea.id}
                      className="rounded-[10px] border border-border bg-card px-2.5 py-2 hover:bg-row-hover"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/app/ideas/${idea.id}`}
                          prefetch="intent"
                          className="min-w-0 flex-1 no-underline"
                        >
                          <p className="idea-title-wrap ui-title line-clamp-3 text-[13px] leading-snug text-foreground">
                            {idea.title}
                          </p>
                          <div className="mt-1">
                            <TagList tags={idea.tags} limit={2} />
                          </div>
                          <p className="mt-1 flex flex-wrap gap-x-2 font-mono text-[11px] text-muted-foreground">
                            <span>{formatAgedDays(idea.agedDays)}</span>
                            <span>コメント {idea.commentCount}</span>
                            {idea.researchedAt || idea.researchNotes ? <span>調査済</span> : null}
                            <IdeaScoreChips idea={idea} />
                            <ReviewStatusBadge idea={idea} />
                            <ReflectionBadge idea={idea} />
                          </p>
                          {showReview ? <IdeaReviewPrompt idea={idea} compact /> : null}
                        </Link>
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
