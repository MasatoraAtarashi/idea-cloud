import type { Dictionary } from "../i18n/dictionary";

export function inspirationDeleteConfirmMessage(t: Dictionary, title: string): string {
  const compact = title.replace(/\s+/g, " ").trim() || t.inspiration.untitled;
  return t.inspiration.deleteConfirm(compact);
}

export function confirmInspirationDelete(t: Dictionary, title: string): boolean {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return false;
  return window.confirm(inspirationDeleteConfirmMessage(t, title));
}
