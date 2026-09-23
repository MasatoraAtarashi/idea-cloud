import { hostnameFromUrl, isPublicHttpUrl } from "../../server/ogp/url";

export const RESEARCH_SOURCE_MAX = 5;
export const RESEARCH_QUERY_MAX = 120;
export const RESEARCH_TITLE_MAX = 200;
export const RESEARCH_SNIPPET_MAX = 280;
export const WEB_SEARCH_UNAVAILABLE_LABEL = "Web検索未取得";

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
};

export type ResearchSearchStatus = "ok" | "failed";

export type ResearchSources = {
  status: ResearchSearchStatus;
  query: string;
  results: ResearchSource[];
  /** Providers actually called, including the one that succeeded. Diagnostic only. */
  providersTried?: string[];
  /** Short failure code such as `no_search_api_key`. Diagnostic only. */
  reason?: string;
};

const SEARCH_ENGINE_HOSTS = new Set([
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "html.duckduckgo.com",
  "lite.duckduckgo.com",
  "api.duckduckgo.com",
  "google.com",
  "www.google.com",
  "search.brave.com",
  "api.search.brave.com",
]);

function clip(value: string, max: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return compact.slice(0, max).trim();
}

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
    });
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "));
}

function normalizeSourceUrl(raw: string): string | null {
  const unwrapped = unwrapDuckDuckGoUrl(raw);
  if (!isPublicHttpUrl(unwrapped)) return null;
  try {
    const url = new URL(unwrapped);
    const host = url.hostname.trim().toLowerCase().replace(/\.$/, "");
    if (SEARCH_ENGINE_HOSTS.has(host)) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function normalizeDedupeKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    let href = parsed.href;
    if (href.endsWith("/") && parsed.pathname === "/") {
      return href;
    }
    return href.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function unwrapDuckDuckGoUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg?.trim()) return uddg.trim();
    return url.href;
  } catch {
    return trimmed;
  }
}

export function emptyResearchSources(
  query = "",
  status: ResearchSearchStatus = "failed",
): ResearchSources {
  return { status, query: clip(query, RESEARCH_QUERY_MAX), results: [] };
}

export function sanitizeResearchSource(raw: {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
}): ResearchSource | null {
  const url = normalizeSourceUrl(raw.url ?? "");
  if (!url) return null;
  const title = clip(raw.title ?? "", RESEARCH_TITLE_MAX) || hostnameFromUrl(url) || url;
  const snippet = clip(raw.snippet ?? "", RESEARCH_SNIPPET_MAX);
  return { title, url, snippet };
}

export function mergeResearchSources(
  batches: readonly (readonly ResearchSource[])[],
  max = RESEARCH_SOURCE_MAX,
): ResearchSource[] {
  const seen = new Set<string>();
  const merged: ResearchSource[] = [];
  for (const batch of batches) {
    for (const source of batch) {
      const clean = sanitizeResearchSource(source);
      if (!clean) continue;
      const key = normalizeDedupeKey(clean.url);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(clean);
      if (merged.length >= max) return merged;
    }
  }
  return merged;
}

export function parseResearchSources(raw: string | null | undefined): ResearchSources | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const status: ResearchSearchStatus = record.status === "ok" ? "ok" : "failed";
    const query = typeof record.query === "string" ? clip(record.query, RESEARCH_QUERY_MAX) : "";
    const results = Array.isArray(record.results)
      ? mergeResearchSources([
          record.results.flatMap((item) => {
            if (!item || typeof item !== "object") return [];
            const row = item as Record<string, unknown>;
            const source = sanitizeResearchSource({
              title: typeof row.title === "string" ? row.title : "",
              url: typeof row.url === "string" ? row.url : "",
              snippet: typeof row.snippet === "string" ? row.snippet : "",
            });
            return source ? [source] : [];
          }),
        ])
      : [];
    const providersTried = readProvidersTried(record.providersTried);
    const reason = readSearchReason(record.reason);
    return {
      status: status === "ok" && results.length === 0 ? "failed" : status,
      query,
      results,
      ...(providersTried ? { providersTried } : {}),
      ...(reason ? { reason } : {}),
    };
  } catch {
    return null;
  }
}

export function serializeResearchSources(value: ResearchSources): string {
  const results = mergeResearchSources([value.results]);
  const status: ResearchSearchStatus =
    value.status === "ok" && results.length > 0 ? "ok" : "failed";
  const providersTried = readProvidersTried(value.providersTried);
  const reason = readSearchReason(value.reason);
  return JSON.stringify({
    status,
    query: clip(value.query, RESEARCH_QUERY_MAX),
    results,
    ...(providersTried ? { providersTried } : {}),
    ...(reason ? { reason } : {}),
  });
}

const PROVIDER_NAME_MAX = 40;
const PROVIDERS_TRIED_MAX = 8;
const SEARCH_REASON_MAX = 80;

function readProvidersTried(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const names = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= PROVIDER_NAME_MAX)
    .slice(0, PROVIDERS_TRIED_MAX);
  return names.length > 0 ? names : undefined;
}

function readSearchReason(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const reason = raw.replace(/\s+/g, " ").trim();
  if (!reason || reason.length > SEARCH_REASON_MAX) return undefined;
  return reason;
}

export function hasResearchSourceLinks(
  value: ResearchSources | null | undefined,
): value is ResearchSources {
  return Boolean(value && value.status === "ok" && value.results.length > 0);
}

export function sourceHostname(url: string): string {
  return hostnameFromUrl(url);
}

/** After a research run, always show 先行事例 (links or Web検索未取得). */
export function researchSourcesForDisplay(idea: {
  researchedAt?: string | null;
  researchNotes?: string | null;
  researchSources?: ResearchSources | null;
}): ResearchSources | null {
  if (!idea.researchedAt && !idea.researchNotes?.trim()) return null;
  return idea.researchSources ?? emptyResearchSources("", "failed");
}

export function buildSearchQuery(title: string, body: string): string {
  const trimmedTitle = title.replace(/\s+/g, " ").trim();
  const firstLine = (body.split("\n")[0] ?? "").replace(/\s+/g, " ").trim();
  const rest = body.replace(/\s+/g, " ").trim();
  const base = trimmedTitle && trimmedTitle !== "無題" ? trimmedTitle : firstLine || rest;
  const clipped = clip(base, RESEARCH_QUERY_MAX);
  if (!clipped) return "";
  if (clipped.includes("先行事例")) return clipped;
  const withHint = clip(`${clipped} 先行事例`, RESEARCH_QUERY_MAX);
  return withHint || clipped;
}

export function formatResearchUserText(
  ideaText: string,
  sources: ResearchSources | null | undefined,
): string {
  const idea = ideaText.trim() || "（本文なし）";
  if (hasResearchSourceLinks(sources)) {
    const lines = sources.results.map((source, index) => {
      const snippet = source.snippet ? `\n   ${source.snippet}` : "";
      return `${index + 1}. ${source.title}\n   ${source.url}${snippet}`;
    });
    return `アイデア:\n${idea}\n\n先行事例（ウェブ検索）:\n${lines.join("\n")}`;
  }
  return [
    `アイデア:\n${idea}`,
    "先行事例（ウェブ検索）: 取得できませんでした。本文だけから考察し、存在しないURLや出典を書かないでください。",
  ].join("\n\n");
}

function attr(tag: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(re);
  return decodeHtmlEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function classList(tag: string): string {
  return ` ${attr(tag, "class").toLowerCase()} `;
}

export function parseDuckDuckGoHtml(html: string): ResearchSource[] {
  const results: ResearchSource[] = [];
  const linkRe = /<a\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html))) {
    const open = match[0] ?? "";
    if (!classList(open).includes(" result__a ")) continue;
    const closeAt = html.indexOf("</a>", match.index);
    if (closeAt < 0) continue;
    const inner = html.slice(match.index + open.length, closeAt);
    const href = attr(open, "href");
    const title = stripTags(inner);
    const after = html.slice(closeAt, closeAt + 1200);
    const snippetMatch = after.match(
      /<a\b[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div\b[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    const snippet = stripTags(snippetMatch?.[1] ?? snippetMatch?.[2] ?? "");
    const source = sanitizeResearchSource({ title, url: href, snippet });
    if (source) results.push(source);
  }
  return mergeResearchSources([results]);
}

export function parseDuckDuckGoLiteHtml(html: string): ResearchSource[] {
  const results: ResearchSource[] = [];
  const linkRe = /<a\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html))) {
    const open = match[0] ?? "";
    if (!classList(open).includes(" result-link ")) continue;
    const closeAt = html.indexOf("</a>", match.index);
    if (closeAt < 0) continue;
    const inner = html.slice(match.index + open.length, closeAt);
    const href = attr(open, "href");
    const title = stripTags(inner);
    const after = html.slice(closeAt, closeAt + 1500);
    const snippetMatch = after.match(
      /<td\b[^>]*class=["'][^"']*result-snippet[^"']*["'][^>]*>([\s\S]*?)<\/td>/i,
    );
    const snippet = stripTags(snippetMatch?.[1] ?? "");
    const source = sanitizeResearchSource({ title, url: href, snippet });
    if (source) results.push(source);
  }
  return mergeResearchSources([results]);
}

export function parseBingHtml(html: string): ResearchSource[] {
  const results: ResearchSource[] = [];
  const blockRe = /<li\b[^>]*class="[^"]*\bb_algo\b[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(html))) {
    const inner = block[1] ?? "";
    const anchor = inner.match(/<h2\b[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!anchor) continue;
    const href = attr(`<a ${anchor[1] ?? ""}>`, "href");
    const title = stripTags(anchor[2] ?? "");
    const snippetMatch = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const snippet = stripTags(snippetMatch?.[1] ?? "");
    const source = sanitizeResearchSource({ title, url: href, snippet });
    if (source) results.push(source);
  }
  return mergeResearchSources([results]);
}

function collectDuckDuckGoTopics(value: unknown, into: ResearchSource[]): void {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (Array.isArray(record.Topics)) {
      collectDuckDuckGoTopics(record.Topics, into);
      continue;
    }
    const source = sanitizeResearchSource({
      title: typeof record.Text === "string" ? record.Text.split(" - ")[0] : "",
      url: typeof record.FirstURL === "string" ? record.FirstURL : "",
      snippet: typeof record.Text === "string" ? record.Text : "",
    });
    if (source) into.push(source);
  }
}

export function parseDuckDuckGoInstantAnswer(data: unknown): ResearchSource[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const found: ResearchSource[] = [];
  const abstract = sanitizeResearchSource({
    title: typeof record.Heading === "string" ? record.Heading : "",
    url: typeof record.AbstractURL === "string" ? record.AbstractURL : "",
    snippet: typeof record.AbstractText === "string" ? record.AbstractText : "",
  });
  if (abstract) found.push(abstract);
  collectDuckDuckGoTopics(record.Results, found);
  collectDuckDuckGoTopics(record.RelatedTopics, found);
  return mergeResearchSources([found]);
}

export function parseBraveWebSearch(data: unknown): ResearchSource[] {
  if (!data || typeof data !== "object") return [];
  const web = (data as Record<string, unknown>).web;
  if (!web || typeof web !== "object") return [];
  const rows = (web as Record<string, unknown>).results;
  if (!Array.isArray(rows)) return [];
  const found: ResearchSource[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const source = sanitizeResearchSource({
      title: typeof record.title === "string" ? record.title : "",
      url: typeof record.url === "string" ? record.url : "",
      snippet:
        typeof record.description === "string"
          ? record.description
          : typeof record.snippet === "string"
            ? record.snippet
            : "",
    });
    if (source) found.push(source);
  }
  return mergeResearchSources([found]);
}
