/** Coarse idea bucket. Distinct from freeform tags. */
export type IdeaCategory = {
  id: number;
  name: string;
};

export const CATEGORY_NAME_MAX = 40;
/** Category UI copy lives in `t.compose.category`. Server-side validation copy stays here. */
export const CATEGORY_NAME_TOO_LONG = "カテゴリ名が長すぎます";

export const DEFAULT_CATEGORY_NAMES = ["執筆アイデア", "事業アイデア", "組織改善"] as const;

export function normalizeCategoryName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
