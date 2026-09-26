import type { MockIdea } from "../data/mock";
import type { Dictionary } from "../i18n/dictionary";

export function ideaPublicId(id: string): string {
  return `IC-${id}`;
}

function agedDaysSince(createdAt: string, now = Date.now()): number {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((now - ms) / 86_400_000));
}

export function ideaExcerpt(idea: MockIdea): string {
  const lines = idea.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  if (lines[0] === idea.title) {
    return lines.slice(1).join(" ");
  }
  return lines.slice(1).join(" ") || "";
}

export function formatAgedDays(t: Dictionary, days: number): string {
  return t.list.days(days);
}

/** Prose relative time; the copy comes from `t.list.relative`. */
export function formatRelativeJa(t: Dictionary, createdAt: string, now = Date.now()): string {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return createdAt;
  const delta = Math.max(0, now - ms);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return t.list.relative.now;
  if (minutes < 60) return t.list.relative.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.list.relative.hoursAgo(hours);
  const days = agedDaysSince(createdAt);
  if (days === 1) return t.list.relative.yesterday;
  if (days < 7) return t.list.relative.daysAgo(days);
  if (days < 14) return t.list.relative.lastWeek;
  if (days < 45) return t.list.relative.weeksAgo(Math.floor(days / 7));
  return t.list.days(days);
}

/** Numeric absolute date. The separator order lives in `t.list.date`. */
export function formatDateJa(t: Dictionary, createdAt: string): string {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return createdAt;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return t.list.date(String(y), m, d);
}

export function initialsFromLabel(label: string): string {
  const compact = label.replace(/\s+/g, "");
  return compact.slice(0, 1) || "・";
}
