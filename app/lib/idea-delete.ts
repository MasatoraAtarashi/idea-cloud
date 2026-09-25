import type { Dictionary } from "../i18n/dictionary";

export function ideaDeleteConfirmMessage(t: Dictionary, title: string): string {
  const compact = title.replace(/\s+/g, " ").trim() || t.idea.untitled;
  return t.idea.deleteConfirm(compact);
}

export function confirmIdeaDelete(t: Dictionary, title: string): boolean {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return false;
  return window.confirm(ideaDeleteConfirmMessage(t, title));
}
