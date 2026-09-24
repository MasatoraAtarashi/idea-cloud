import { JEV_MODEL, JEV_MODEL_LABEL } from "../lib/jev";

function toMs(value: string): number {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return Date.parse(iso);
}

/** Compact mono age: `15h`, `5d`, `3w`. Used as `15h ago` / `5d` in dense meta. */
export function shortAge(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "";
  const ms = toMs(value);
  if (Number.isNaN(ms)) return "";
  const minutes = Math.max(0, Math.floor((now - ms) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function shortAgo(value: string | null | undefined, now = Date.now()): string {
  const age = shortAge(value, now);
  if (!age) return "";
  return age === "now" ? "just now" : `${age} ago`;
}

/** `@cf/meta/llama-3.1-8b-instruct-fp8-fast` → `llama-3.1-8b`. */
export function shortModelName(model: string | null | undefined): string {
  if (!model) return "";
  if (model === JEV_MODEL) return JEV_MODEL_LABEL;
  const last = model.split("/").pop() ?? model;
  return last.replace(/-instruct.*$/, "").replace(/-fp8.*$/, "");
}
