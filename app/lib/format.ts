import type { MockIdea } from "../data/mock";

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

export function formatAgedDays(days: number): string {
  return `${days}日`;
}

export function formatRelativeJa(createdAt: string, now = Date.now()): string {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return createdAt;
  const delta = Math.max(0, now - ms);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = agedDaysSince(createdAt);
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  if (days < 14) return "先週";
  if (days < 45) return `${Math.floor(days / 7)}週間前`;
  return `${days}日`;
}

export function formatDateJa(createdAt: string): string {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return createdAt;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function initialsFromLabel(label: string): string {
  const compact = label.replace(/\s+/g, "");
  return compact.slice(0, 1) || "・";
}
