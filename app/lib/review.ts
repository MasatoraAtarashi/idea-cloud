export const REVIEW_STATUSES = ["none", "hold", "reviewed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Default review-candidate threshold (days since created_at / last_reviewed_at). */
export const CANDIDATE_DEFAULT_DAYS = 7;

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function parseReviewStatus(raw: unknown): ReviewStatus {
  const value = typeof raw === "string" ? raw.trim() : "";
  return isReviewStatus(value) ? value : "none";
}
