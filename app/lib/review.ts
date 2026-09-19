export const REVIEW_STATUSES = ["none", "hold", "reviewed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  none: "未見直し",
  hold: "保留",
  reviewed: "見直した",
};

/** Default 熟成候補 threshold (days since created_at / last_reviewed_at). */
export const CANDIDATE_DEFAULT_DAYS = 7;

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function parseReviewStatus(raw: unknown): ReviewStatus {
  const value = typeof raw === "string" ? raw.trim() : "";
  return isReviewStatus(value) ? value : "none";
}
