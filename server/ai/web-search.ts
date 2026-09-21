import {
  emptyResearchSources,
  parseBingHtml,
  parseBraveWebSearch,
  parseDuckDuckGoHtml,
  parseDuckDuckGoInstantAnswer,
  type ResearchSources,
} from "../../app/lib/research-sources";

export const WEB_SEARCH_TIMEOUT_MS = 5_000;
export const WEB_SEARCH_HTML_MAX_BYTES = 256 * 1024;
export const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";
export const DUCKDUCKGO_HTML_URL = "https://html.duckduckgo.com/html/";
export const BING_SEARCH_URL = "https://www.bing.com/search";
export const DUCKDUCKGO_INSTANT_URL = "https://api.duckduckgo.com/";

const SEARCH_UA = "IdeaCloudResearch/1.0";

export type WebSearchFetch = (url: string, init: RequestInit) => Promise<Response>;

type TestWebSearch = (query: string) => Promise<ResearchSources>;

let testWebSearch: TestWebSearch | undefined;
let testSearchFetch: WebSearchFetch | undefined;

/** Test-only. Production always fetches search HTML / optional Brave API. */
export function setTestWebSearch(run?: TestWebSearch) {
  testWebSearch = run;
}

/** Test-only HTML/JSON transport for parser integration. */
export function setTestSearchFetch(run?: WebSearchFetch) {
  testSearchFetch = run;
}

export function searchApiKeyFromEnv(env: { SEARCH_API_KEY?: string }): string | undefined {
  const key = env.SEARCH_API_KEY?.trim();
  return key || undefined;
}

function transport(): WebSearchFetch {
  return testSearchFetch ?? fetch;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxBytes - received;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        received += remaining;
        break;
      }
      chunks.push(value);
      received += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

async function fetchText(
  url: string,
  init: RequestInit,
  maxBytes = WEB_SEARCH_HTML_MAX_BYTES,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);
  try {
    const response = await transport()(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "user-agent": SEARCH_UA,
        ...init.headers,
      },
    });
    if (!response.ok) return null;
    return await readLimited(response, maxBytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function searchBrave(query: string, apiKey: string): Promise<ResearchSources | null> {
  const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=5&search_lang=jp`;
  const text = await fetchText(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-subscription-token": apiKey,
    },
  });
  if (!text) return null;
  try {
    const results = parseBraveWebSearch(JSON.parse(text) as unknown);
    if (results.length === 0) return null;
    return { status: "ok", query, results };
  } catch {
    return null;
  }
}

async function searchDuckDuckGoHtml(query: string): Promise<ResearchSources | null> {
  const url = `${DUCKDUCKGO_HTML_URL}?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url, { method: "GET" });
  if (!html) return null;
  const results = parseDuckDuckGoHtml(html);
  if (results.length === 0) return null;
  return { status: "ok", query, results };
}

async function searchBingHtml(query: string): Promise<ResearchSources | null> {
  const url = `${BING_SEARCH_URL}?q=${encodeURIComponent(query)}&setlang=ja-JP`;
  const html = await fetchText(url, { method: "GET" });
  if (!html) return null;
  const results = parseBingHtml(html);
  if (results.length === 0) return null;
  return { status: "ok", query, results };
}

async function searchDuckDuckGoInstant(query: string): Promise<ResearchSources | null> {
  const url = `${DUCKDUCKGO_INSTANT_URL}?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`;
  const text = await fetchText(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!text) return null;
  try {
    const results = parseDuckDuckGoInstantAnswer(JSON.parse(text) as unknown);
    if (results.length === 0) return null;
    return { status: "ok", query, results };
  } catch {
    return null;
  }
}

/**
 * Fail-soft web search: optional Brave (`SEARCH_API_KEY`), then HTML search pages,
 * then DuckDuckGo Instant Answer JSON. Never throws.
 */
export async function searchWebSources(opts: {
  query: string;
  apiKey?: string | null;
}): Promise<ResearchSources> {
  const query = opts.query.trim();
  if (!query) return emptyResearchSources("", "failed");

  if (testWebSearch) {
    try {
      return await testWebSearch(query);
    } catch {
      return emptyResearchSources(query, "failed");
    }
  }

  const apiKey = opts.apiKey?.trim() ?? "";
  if (apiKey) {
    const brave = await searchBrave(query, apiKey);
    if (brave) return brave;
  }

  const html = await searchDuckDuckGoHtml(query);
  if (html) return html;

  const bing = await searchBingHtml(query);
  if (bing) return bing;

  const instant = await searchDuckDuckGoInstant(query);
  if (instant) return instant;

  return emptyResearchSources(query, "failed");
}
