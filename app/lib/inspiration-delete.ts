export function inspirationDeleteConfirmMessage(title: string): string {
  const compact = title.replace(/\s+/g, " ").trim() || "無題";
  return `「${compact}」を削除します。この操作は取り消せません。`;
}

export function confirmInspirationDelete(title: string): boolean {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return false;
  return window.confirm(inspirationDeleteConfirmMessage(title));
}
