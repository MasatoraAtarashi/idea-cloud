import { isPublicHttpUrl } from "./url";

export const OG_TITLE_MAX = 300;
export const OG_DESCRIPTION_MAX = 500;
export const OG_SITE_NAME_MAX = 200;
export const OG_IMAGE_URL_MAX = 2000;

export type ParsedOpenGraph = {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
};

const META_TAG_RE = /<meta\b[^>]*>/gi;
const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title>/i;
const ATTR_RE = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max).trim();
}

function attrsOf(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(tag))) {
    const key = match[1]?.toLowerCase();
    if (!key || key === "meta" || key.startsWith("<") || key.startsWith("/")) continue;
    attrs[key] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function firstMeta(bag: Map<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = bag.get(key);
    if (value) return value;
  }
  return "";
}

function resolveImageUrl(raw: string, pageUrl: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const resolved = new URL(trimmed, pageUrl).href;
    if (!isPublicHttpUrl(resolved, { httpsOnly: true })) return "";
    return clip(resolved, OG_IMAGE_URL_MAX);
  } catch {
    return "";
  }
}

/** Parse Open Graph / Twitter / fallback title from an HTML document. */
export function parseOpenGraphHtml(html: string, pageUrl: string): ParsedOpenGraph {
  const bag = new Map<string, string>();
  META_TAG_RE.lastIndex = 0;
  let tag: RegExpExecArray | null;
  while ((tag = META_TAG_RE.exec(html))) {
    const attrs = attrsOf(tag[0] ?? "");
    const key = (attrs.property || attrs.name || attrs.itemprop || "").trim().toLowerCase();
    const content = (attrs.content || attrs.value || "").trim();
    if (!key || !content || bag.has(key)) continue;
    bag.set(key, content);
  }

  const titleTag = html.match(TITLE_RE)?.[1] ?? "";
  const title = clip(
    firstMeta(bag, ["og:title", "twitter:title"]) || decodeHtmlEntities(titleTag),
    OG_TITLE_MAX,
  );
  const description = clip(
    firstMeta(bag, ["og:description", "twitter:description", "description"]),
    OG_DESCRIPTION_MAX,
  );
  const imageRaw = firstMeta(bag, [
    "og:image",
    "og:image:url",
    "og:image:secure_url",
    "twitter:image",
    "twitter:image:src",
  ]);
  const siteName = clip(firstMeta(bag, ["og:site_name", "application-name"]), OG_SITE_NAME_MAX);

  return {
    title,
    description,
    imageUrl: resolveImageUrl(imageRaw, pageUrl),
    siteName,
  };
}
