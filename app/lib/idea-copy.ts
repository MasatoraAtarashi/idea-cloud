import { STAGE_LABEL, type Stage } from "../data/mock";

export const COPY_OK_MESSAGE = "コピーしました";
export const COPY_FAIL_MESSAGE = "コピーできませんでした";

export function formatIdeaCopyText(idea: {
  title: string;
  body: string;
  stage: Stage;
  tags: string[];
}): string {
  const title = idea.title.trim() || "無題";
  const body = idea.body.trim();
  const lines = [title];
  if (body) lines.push("", body);
  lines.push("", `段階: ${STAGE_LABEL[idea.stage]}`);
  if (idea.tags.length > 0) {
    lines.push(`タグ: ${idea.tags.join(", ")}`);
  }
  return lines.join("\n");
}

/** Clipboard API first. Falls back to a hidden textarea, then reports failure. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission or a non-secure context. Try the textarea path below.
  }
  try {
    if (typeof document === "undefined") return false;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
