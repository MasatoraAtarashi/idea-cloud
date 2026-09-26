import { hostnameFromUrl } from "../../server/ogp/url";
import type { Dictionary } from "../i18n/dictionary";
import { INSPIRATION_UNTITLED, fallbackTitleFromUrl } from "./inspiration-input";
import { STAGE_PILL_HEX } from "./tokens";

export type InspirationCardTone = {
  bg: string;
  fg: string;
};

const TONES: InspirationCardTone[] = [
  STAGE_PILL_HEX.spark,
  STAGE_PILL_HEX.aging,
  STAGE_PILL_HEX.ripe,
  STAGE_PILL_HEX.selected,
];

export function inspirationHostname(url: string | null | undefined): string {
  return hostnameFromUrl(url ?? "");
}

export function inspirationSiteLabel(item: { url: string | null; ogSiteName?: string }): string {
  const site = item.ogSiteName?.trim() ?? "";
  if (site) return site;
  return inspirationHostname(item.url);
}

export function inspirationHeadline(
  t: Dictionary,
  item: {
    title: string;
    url: string | null;
    ogTitle?: string;
  },
): string {
  const title = item.title.trim();
  const url = (item.url ?? "").trim();
  const ogTitle = item.ogTitle?.trim() ?? "";
  const placeholder = !title || title === INSPIRATION_UNTITLED || title === url;
  if (!placeholder) return title;
  if (ogTitle) return ogTitle;
  if (url) {
    const fallback = fallbackTitleFromUrl(url);
    if (fallback && fallback !== INSPIRATION_UNTITLED) return fallback;
  }
  return t.inspiration.untitled;
}

export function inspirationSnippet(item: { memo: string; ogDescription?: string }): string {
  const memo = item.memo.trim();
  if (memo) return memo;
  return item.ogDescription?.trim() ?? "";
}

export function inspirationGlyph(item: { title: string; url: string | null }): string {
  const host = inspirationHostname(item.url);
  const source = host || item.title.trim() || "・";
  const letter = source.replace(/^www\./, "").slice(0, 1);
  return letter.toUpperCase() || "・";
}

export function inspirationTone(key: string): InspirationCardTone {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TONES[hash % TONES.length] ?? TONES[0]!;
}

/** Masonry rhythm: 100–180px, stable per card. */
export function inspirationMediaHeight(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const steps = [100, 120, 140, 160, 180];
  return steps[(hash * 7 + 3) % steps.length] ?? 140;
}

export type InspirationIdeaDraft = {
  title: string;
  body: string;
  tags: string[];
};

/** Prefill for 「アイデアにする」: page title, memo + a mono reference line, the card's tags. */
export function inspirationIdeaDraft(
  t: Dictionary,
  item: {
    title: string;
    url: string | null;
    memo: string;
    tags: string[];
    ogTitle?: string;
  },
): InspirationIdeaDraft {
  const url = item.url?.trim() ?? "";
  const memo = item.memo.trim();
  const reference = url ? t.inspiration.reference(url) : "";
  return {
    title: inspirationHeadline(t, item),
    body: [memo, reference].filter(Boolean).join("\n\n"),
    tags: item.tags,
  };
}
