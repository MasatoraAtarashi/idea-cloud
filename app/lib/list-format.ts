import type { Stage } from "../data/mock";

function timeMs(value: string): number | null {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Row meta in mono: `now`, `12m`, `15h`, `5d`, `3w`. */
export function compactRelative(value: string, now = Date.now()): string {
  const ms = timeMs(value);
  if (ms == null) return "";
  const minutes = Math.floor(Math.max(0, now - ms) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function compactAgedDays(days: number): string {
  return `${Math.max(0, days)}d`;
}

/** Group order on the list: what is maturing first, what was just caught next. */
export const LIST_GROUP_ORDER: Stage[] = ["aging", "ripe", "spark", "selected", "archived"];

export const LIST_GROUP_HINT: Record<Stage, string> = {
  aging: "寝かせている。触らなくていい。",
  ripe: "読み返す頃合い。進めるか決める。",
  spark: "捕まえたばかり。磨かない。",
  selected: "動かすと決めたもの。",
  archived: "いまは動かさない。",
};
