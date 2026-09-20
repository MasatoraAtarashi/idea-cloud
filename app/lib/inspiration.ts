import { STAGE_PILL_HEX } from "./tokens";
import { hostnameFromUrl } from "../../server/ogp/url";

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

export function inspirationHeadline(item: {
  title: string;
  url: string | null;
  ogTitle?: string;
}): string {
  const title = item.title.trim();
  if (title && title !== "無題" && title !== (item.url ?? "").trim()) return title;
  const ogTitle = item.ogTitle?.trim() ?? "";
  if (ogTitle) return ogTitle;
  return title || "無題";
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
