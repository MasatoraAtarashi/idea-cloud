/** Distinct http(s) URLs to copy from an idea body onto the inspiration shelf. */
export const IDEA_URL_INSPIRATION_CAP = 5;
export const IDEA_URL_EXCERPT_MAX = 160;

const URL_RE = /https?:\/\/[^\s<>"'`）)】\]}>]+/gi;
const TRAILING_PUNCT_RE = /[.,;:!?。、]+$/;

export function normalizeInspirationUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${host}${path}${url.search}`;
  } catch {
    return "";
  }
}

function stripTrailer(raw: string): string {
  return raw.replace(TRAILING_PUNCT_RE, "");
}

function canonicalHref(raw: string): string | null {
  const cleaned = stripTrailer(raw);
  const key = normalizeInspirationUrl(cleaned);
  if (!key) return null;
  try {
    return new URL(cleaned).href;
  } catch {
    return key;
  }
}

/** First N distinct http(s) URLs in document order. No fetch. */
export function extractHttpUrls(text: string, cap = IDEA_URL_INSPIRATION_CAP): string[] {
  const found = text.match(URL_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of found) {
    const href = canonicalHref(raw);
    if (!href) continue;
    const key = normalizeInspirationUrl(href);
    if (!key || seen.has(key)) continue;
    if (href.length > 2000) continue;
    seen.add(key);
    out.push(href);
    if (out.length >= cap) break;
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Title from markdown link text, same-line leftover, previous line, or hostname. */
export function titleFromUrlContext(text: string, url: string): string {
  const md = text.match(new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegExp(url)}\\)`));
  const mdTitle = md?.[1]?.replace(/\s+/g, " ").trim();
  if (mdTitle) return mdTitle.slice(0, 200);

  const lines = text.split(/\r?\n/);
  const line = lines.find((item) => item.includes(url));
  if (line) {
    const around = line
      .replace(url, " ")
      .replace(/[\[\]()（）]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (around.length >= 2) return around.slice(0, 200);
  }

  const idx = text.indexOf(url);
  if (idx > 0) {
    const prev = text
      .slice(0, idx)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .at(-1);
    if (prev && !/^https?:\/\//i.test(prev)) return prev.slice(0, 200);
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || url.slice(0, 200);
  } catch {
    return url.slice(0, 200);
  }
}

export function excerptAroundUrl(text: string, url: string, max = IDEA_URL_EXCERPT_MAX): string {
  const idx = text.indexOf(url);
  const slice =
    idx < 0
      ? text.slice(0, max)
      : text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + url.length + 80));
  let excerpt = slice.replace(/\s+/g, " ").trim();
  if (idx > 40) excerpt = `…${excerpt}`;
  if (idx >= 0 && idx + url.length + 80 < text.length) excerpt = `${excerpt}…`;
  return excerpt.slice(0, max);
}
