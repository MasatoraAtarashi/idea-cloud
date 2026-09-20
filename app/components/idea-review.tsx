import { useFetcher } from "react-router";
import { nextStage, STAGE_LABEL, type MockIdea } from "../data/mock";
import { REVIEW_STATUS_LABEL, type ReviewStatus } from "../lib/review";
import { useInstantPending } from "../lib/use-instant-pending";
import { IconSpinner } from "./icons";

export function IdeaReviewPrompt({
  idea,
  compact = false,
  showNextStage = true,
}: {
  idea: MockIdea;
  compact?: boolean;
  showNextStage?: boolean;
}) {
  const reviewFetcher = useFetcher();
  const stageFetcher = useFetcher();
  const reviewBusy = reviewFetcher.state !== "idle";
  const stageBusy = stageFetcher.state !== "idle";
  const reviewPending = useInstantPending(reviewBusy);
  const stagePending = useInstantPending(stageBusy);
  const next = nextStage(idea.stage);
  const status = (idea.reviewStatus ?? "none") as ReviewStatus;

  if (idea.stage === "archived") return null;

  function submitReview(reviewStatus: "reviewed" | "hold") {
    reviewPending.hold();
    const data = new FormData();
    data.set("intent", "review");
    data.set("reviewStatus", reviewStatus);
    void reviewFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  function submitNextStage() {
    if (!next) return;
    stagePending.hold();
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", next);
    void stageFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  return (
    <div
      className={compact ? "mt-1.5" : "mt-5 rounded-[10px] border border-border bg-card px-3 py-3"}
    >
      {compact ? null : (
        <div className="mb-2">
          <p className="text-[13.5px] font-medium">見直し</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            寝かせたあと、進めるか一旦止めるかを決めます。
            {status !== "none" ? ` いまは${REVIEW_STATUS_LABEL[status]}。` : ""}
          </p>
        </div>
      )}
      <div className={`flex flex-wrap gap-1.5 ${compact ? "" : ""}`}>
        <button
          type="button"
          disabled={reviewPending.pending}
          onClick={() => submitReview("reviewed")}
          className={
            compact
              ? "rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-foreground hover:bg-accent"
              : "ui-btn-secondary min-h-11 px-3 text-[13px]"
          }
        >
          {reviewPending.pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          見直した
        </button>
        <button
          type="button"
          disabled={reviewPending.pending}
          onClick={() => submitReview("hold")}
          className={
            compact
              ? "rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-foreground hover:bg-accent"
              : "ui-btn-secondary min-h-11 px-3 text-[13px]"
          }
        >
          保留
        </button>
        {showNextStage && next ? (
          <button
            type="button"
            disabled={stagePending.pending}
            onClick={submitNextStage}
            className={
              compact
                ? "rounded-full bg-foreground px-2.5 py-1 text-[11.5px] text-background"
                : "ui-btn min-h-11 px-3 text-[13px]"
            }
          >
            {stagePending.pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
            {compact ? "次の段階へ" : `次の段階へ（${STAGE_LABEL[next]}）`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewStatusBadge({ idea }: { idea: MockIdea }) {
  const status = idea.reviewStatus ?? "none";
  if (status === "none") return null;
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
}
