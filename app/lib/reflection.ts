export const REFLECTION_STATUSES = ["none", "tried", "hold", "dropped"] as const;
export type ReflectionStatus = (typeof REFLECTION_STATUSES)[number];

export const REFLECTION_STATUS_LABEL: Record<ReflectionStatus, string> = {
  none: "未記入",
  tried: "試した",
  hold: "保留",
  dropped: "やめた",
};

export const REFLECTION_OUTCOME_MAX = 200;
export const REFLECTION_NOTES_MAX = 2000;

export function isReflectionStatus(value: string): value is ReflectionStatus {
  return (REFLECTION_STATUSES as readonly string[]).includes(value);
}

export function parseReflectionStatus(raw: unknown): ReflectionStatus {
  const value = typeof raw === "string" ? raw.trim() : "";
  return isReflectionStatus(value) ? value : "none";
}

export function hasReflection(idea: {
  reflectionStatus?: ReflectionStatus | null;
  reflectionOutcome?: string | null;
  reflectionNotes?: string | null;
}): boolean {
  if (idea.reflectionStatus && idea.reflectionStatus !== "none") return true;
  if ((idea.reflectionOutcome ?? "").trim()) return true;
  if ((idea.reflectionNotes ?? "").trim()) return true;
  return false;
}
