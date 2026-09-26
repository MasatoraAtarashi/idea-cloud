import type { Stage } from "../data/mock";
import type { Dictionary } from "../i18n/dictionary";

function timeMs(value: string): number | null {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Row meta in mono: `now`, `12m`, `15h`, `5d`, `3w`. */
export function compactRelative(t: Dictionary, value: string, now = Date.now()): string {
  const ms = timeMs(value);
  if (ms == null) return "";
  const minutes = Math.floor(Math.max(0, now - ms) / 60_000);
  if (minutes < 1) return t.list.compact.now;
  if (minutes < 60) return t.list.compact.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.list.compact.hours(hours);
  const days = Math.floor(hours / 24);
  if (days < 60) return t.list.compact.days(days);
  return t.list.compact.weeks(Math.floor(days / 7));
}

export function compactAgedDays(t: Dictionary, days: number): string {
  return t.list.compact.days(Math.max(0, days));
}

/** Group order on the list: what is maturing first, what was just caught next. */
export const LIST_GROUP_ORDER: Stage[] = ["aging", "ripe", "spark", "selected", "archived"];
