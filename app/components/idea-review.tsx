import { useState } from "react";
import { useFetcher } from "react-router";
import { nextStage, reviewAnchorAt, type MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { confirmIdeaDelete } from "../lib/idea-delete";
import { LIST_PATH } from "../lib/home-path";
import { type ReviewStatus } from "../lib/review";
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
  const t = useT();
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
          <p className="text-[13.5px] font-semibold">{t.idea.review.heading}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t.idea.review.hint}
            {status !== "none" ? t.idea.review.current(t.list.reviewStatus[status]) : ""}
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
              ? "rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-foreground hover:bg-muted"
              : "ui-btn-secondary min-h-11 px-3 text-[13px]"
          }
        >
          {reviewPending.pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {t.idea.review.reviewed}
        </button>
        <button
          type="button"
          disabled={reviewPending.pending}
          onClick={() => submitReview("hold")}
          className={
            compact
              ? "rounded-full bg-muted px-2.5 py-1 text-[11.5px] text-foreground hover:bg-muted"
              : "ui-btn-secondary min-h-11 px-3 text-[13px]"
          }
        >
          {t.idea.review.hold}
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
            {compact ? t.idea.nextStage : t.idea.nextStageTo(t.common.stage[next])}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewStatusBadge({ idea }: { idea: MockIdea }) {
  const t = useT();
  const status = idea.reviewStatus ?? "none";
  if (status === "none") return null;
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {t.list.reviewStatus[status]}
    </span>
  );
}

function daysSince(value: string, now = Date.now()): number {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((now - ms) / 86_400_000));
}

const BAND_BUTTON =
  "flex min-h-11 items-center gap-1.5 rounded-[7px] border border-[var(--warn-border)] bg-card px-3 text-[12.5px] font-semibold text-warn hover:bg-[var(--warn-bg)] disabled:opacity-50 md:h-8 md:min-h-8";

/**
 * The review band on detail. Letting go is a small ritual: it asks archive or delete
 * before acting, so delete lives here instead of the ⋯ menu.
 */
export function IdeaReviewBand({ idea }: { idea: MockIdea }) {
  const t = useT();
  const reviewFetcher = useFetcher();
  const discardFetcher = useFetcher();
  const reviewPending = useInstantPending(reviewFetcher.state !== "idle");
  const discardPending = useInstantPending(discardFetcher.state !== "idle");
  const [discarding, setDiscarding] = useState(false);

  if (idea.stage === "archived") return null;
  const days = daysSince(reviewAnchorAt(idea));
  if (days < 1) return null;
  const status = (idea.reviewStatus ?? "none") as ReviewStatus;

  function submitReview(reviewStatus: "reviewed" | "hold") {
    reviewPending.hold();
    const data = new FormData();
    data.set("intent", "review");
    data.set("reviewStatus", reviewStatus);
    void reviewFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  function archive() {
    discardPending.hold();
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", "archived");
    void discardFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
    setDiscarding(false);
  }

  function remove() {
    if (!confirmIdeaDelete(t, idea.title)) return;
    discardPending.hold();
    const data = new FormData();
    data.set("intent", "delete");
    data.set("redirectTo", LIST_PATH);
    void discardFetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  return (
    <div className="mt-7 flex flex-col items-start gap-x-4 gap-y-2.5 rounded-[10px] md:flex-row md:items-center border border-[var(--warn-border)] bg-[var(--warn-bg)] px-4 py-3">
      <p className="min-w-0 text-[13px] leading-[1.7] text-warn md:flex-1">
        {discarding ? t.idea.review.discardPrompt : t.idea.review.rested(days)}
        {!discarding && status !== "none" ? (
          <span className="ml-1.5 font-mono text-[11px] text-[var(--warn-deep)]">
            {t.list.reviewStatus[status]}
          </span>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {discarding ? (
          <>
            <button
              type="button"
              disabled={discardPending.pending}
              onClick={archive}
              className={BAND_BUTTON}
            >
              {discardPending.pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
              {t.idea.review.archive}
            </button>
            <button
              type="button"
              disabled={discardPending.pending}
              onClick={remove}
              className={`${BAND_BUTTON} text-danger`}
            >
              {t.idea.review.delete}
            </button>
            <button
              type="button"
              onClick={() => setDiscarding(false)}
              className="flex min-h-11 items-center px-2 text-[12.5px] text-[var(--warn-deep)] md:h-8 md:min-h-8"
            >
              {t.idea.review.cancel}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={reviewPending.pending}
              onClick={() => submitReview("reviewed")}
              className={BAND_BUTTON}
            >
              {reviewPending.pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
              {t.idea.review.reviewed}
            </button>
            <button
              type="button"
              disabled={reviewPending.pending}
              onClick={() => submitReview("hold")}
              className={`${BAND_BUTTON} font-medium`}
            >
              {t.idea.review.hold}
            </button>
            <button
              type="button"
              onClick={() => setDiscarding(true)}
              className={`${BAND_BUTTON} font-medium`}
            >
              {t.idea.review.discard}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
