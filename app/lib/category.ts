/** Coarse idea bucket. Distinct from freeform tags. */
export type IdeaCategory = {
  id: number;
  name: string;
};

export const CATEGORY_NAME_MAX = 40;
export const CATEGORY_FIELD_LABEL = "カテゴリ";
export const CATEGORY_NONE_LABEL = "なし";
export const CATEGORY_NEW_LABEL = "新しいカテゴリ…";
export const CATEGORY_NAME_PLACEHOLDER = "カテゴリ名";
export const CATEGORY_NAME_TOO_LONG = "カテゴリ名が長すぎます";

export const DEFAULT_CATEGORY_NAMES = ["執筆アイデア", "事業アイデア", "組織改善"] as const;

export function normalizeCategoryName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
