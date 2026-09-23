import { parseAiScore } from "./scores";

export const AI_SCORE_LABEL = "推し度";

export const AI_SCORE_MEANING: Record<number, string> = {
  1: "まだ早い",
  2: "慎重に見たい",
  3: "どちらでもない",
  4: "進めてよさそう",
  5: "強く推したい",
};

export const EVALUATION_SECTION_LABELS = ["強み", "リスク", "新規性", "次の一手"] as const;
export type EvaluationSectionLabel = (typeof EVALUATION_SECTION_LABELS)[number];

export type EvaluationSection = {
  label: EvaluationSectionLabel;
  body: string;
};

export type ParsedEvaluation = {
  score: number | null;
  sections: EvaluationSection[];
};

const HEADING = /^(強み|リスク|新規性|次の一手)\s*[:：]?\s*(.*)$/;

export function aiScoreMeaning(score: number | null | undefined): string {
  if (score == null) return "";
  return AI_SCORE_MEANING[score] ?? "";
}

/** Turn Jev axis decimals into plain Japanese. Unknown text is left readable. */
export function softenEvaluationText(text: string): string {
  const lines = text.split("\n").map((line) => softenEvaluationLine(line));
  return collapseBlankLines(lines).trim();
}

export function parseEvaluationNotes(text: string): ParsedEvaluation | null {
  const score = parseAiScore(text);
  const buckets = new Map<EvaluationSectionLabel, string[]>();
  let current: EvaluationSectionLabel | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      if (current) buckets.get(current)?.push("");
      continue;
    }
    if (/^スコア\s*[:：]\s*[1-5]\s*$/.test(line)) continue;
    const heading = line.match(HEADING);
    if (heading?.[1] && isSectionLabel(heading[1])) {
      current = heading[1];
      if (!buckets.has(current)) buckets.set(current, []);
      if (heading[2]?.trim()) buckets.get(current)?.push(heading[2].trim());
      continue;
    }
    if (current) buckets.get(current)?.push(line);
  }

  const sections: EvaluationSection[] = [];
  for (const label of EVALUATION_SECTION_LABELS) {
    const body = softenEvaluationText((buckets.get(label) ?? []).join("\n"));
    if (body) sections.push({ label, body });
  }
  if (sections.length < 2) return null;
  return { score, sections };
}

function isSectionLabel(value: string): value is EvaluationSectionLabel {
  return (EVALUATION_SECTION_LABELS as readonly string[]).includes(value);
}

function softenEvaluationLine(line: string): string {
  let next = line.replace(
    /進める価値\s*[:：]\s*(-?\d+(?:\.\d+)?)/,
    (_match, raw: string) => `進める価値: ${pursueWords(Number(raw))}`,
  );
  next = next.replace(/[（(]\s*-?\d+(?:\.\d+)?\s*[）)]/g, "");
  return next.replace(/[ \t]{2,}/g, " ").trimEnd();
}

function pursueWords(value: number): string {
  if (!Number.isFinite(value)) return "不明";
  if (value >= 0.67) return "高め";
  if (value >= 0.34) return "ふつう";
  return "低め";
}

function collapseBlankLines(lines: string[]): string {
  const kept: string[] = [];
  for (const line of lines) {
    if (!line.trim() && (kept.length === 0 || !kept[kept.length - 1]?.trim())) continue;
    kept.push(line);
  }
  while (kept.length > 0 && !kept[kept.length - 1]?.trim()) kept.pop();
  return kept.join("\n");
}
