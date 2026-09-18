export const SCORE_MIN = 1;
export const SCORE_MAX = 5;
export const HUMAN_SCORE_NOTE_MAX = 200;

export function parseScore(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isInteger(value) || value < SCORE_MIN || value > SCORE_MAX) return null;
  return value;
}

/** Pull a 1–5 integer from Japanese evaluation text (`スコア: 4`, `4/5`, `4点`). */
export function parseAiScore(text: string): number | null {
  const patterns = [/スコア\s*[:：]\s*([1-5])/, /([1-5])\s*\/\s*5/, /([1-5])\s*点/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}
