import {
  emptyResearchSources,
  parseBingHtml,
  parseBraveWebSearch,
  parseDuckDuckGoHtml,
  parseDuckDuckGoInstantAnswer,
  parseDuckDuckGoLiteHtml,
  type ResearchSources,
} from "../../app/lib/research-sources";
import { logger } from "../logger";

export const WEB_SEARCH_TIMEOUT_MS = 5_000;
export const WEB_SEARCH_HTML_MAX_BYTES = 256 * 1024;
export const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";
export const DUCKDUCKGO_LITE_URL = "https://lite.duckduckgo.com/lite/";
export const DUCKDUCKGO_HTML_URL = "https://html.duckduckgo.com/html/";
export const BING_SEARCH_URL = "https://www.bing.com/search";
export const DUCKDUCKGO_INSTANT_URL = "https://api.duckduckgo.com/";

const SEARCH_UA = "IdeaCloudResearch/1.0";
const SEARCH_ACCEPT_LANGUAGE = "ja,en;q=0.8";

const PROVIDER = {
  brave: "brave",
  ddgLite: "duckduckgo_lite",
  ddgHtml: "duckduckgo_html",
  bing: "bing",
  instant: "duckduckgo_instant",
} as const;

type ProviderName = (typeof PROVIDER)[keyof typeof PROVIDER];
type ProviderError = "http" | "timeout" | "abort" | "network" | "parse" | "empty";

export type WebSearchFetch = (url: string, init: RequestInit) => Promise<Response>;

type TestWebSearch = (query: string) => Promise<ResearchSources>;

type FetchTextResult =
  | { ok: true; status: number; text: string }
  | { ok: false; status: number | null; error: "http" | "timeout" | "abort" | "network" };

let testWebSearch: TestWebSearch | undefined;
let testSearchFetch: WebSearchFetch | undefined;
let testTimeoutMs: number | undefined;

/** Test-only. Production always fetches search HTML / optional Brave API. */
export function setTestWebSearch(run?: TestWebSearch) {
  testWebSearch = run;
}

/** Test-only HTML/JSON transport for parser integration. */
export function setTestSearchFetch(run?: WebSearchFetch) {
  testSearchFetch = run;
}

/** Test-only. Shortens the per-provider abort timer. */
export function setTestWebSearchTimeout(ms?: number) {
  testTimeoutMs = ms;
}

export function searchApiKeyFromEnv(env: { SEARCH_API_KEY?: string }): string | undefined {
  const key = env.SEARCH_API_KEY?.trim();
  return key || undefined;
}

function transport(): WebSearchFetch {
  return testSearchFetch ?? fetch;
}

function searchTimeoutMs(): number {
  return testTimeoutMs ?? WEB_SEARCH_TIMEOUT_MS;
}

function logProviderMiss(fields: {
  provider: ProviderName;
  status: number | null;
  error: ProviderError;
  resultCount: number;
}) {
  logger.warn("web search provider miss", fields);
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
): Promise<FetchTextResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, searchTimeoutMs());
  try {
    const response = await transport()(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "accept-language": SEARCH_ACCEPT_LANGUAGE,
        "user-agent": SEARCH_UA,
        ...init.headers,
      },
    });
    if (!response.ok) {
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
      return { ok: false, status: response.status, error: "http" };
    }
    return { ok: true, status: response.status, text: await readLimited(response, maxBytes) };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const aborted = name === "AbortError" || controller.signal.aborted;
    return {
      ok: false,
      status: null,
      error: timedOut ? "timeout" : aborted ? "abort" : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function loadProvider(
  provider: ProviderName,
  tried: string[],
  url: string,
  init: RequestInit,
): Promise<{ status: number; text: string } | null> {
  tried.push(provider);
  const fetched = await fetchText(url, init);
  if (!fetched.ok) {
    logProviderMiss({
      provider,
      status: fetched.status,
      error: fetched.error,
      resultCount: 0,
    });
    return null;
  }
  return { status: fetched.status, text: fetched.text };
}

function missParsed(provider: ProviderName, status: number, error: "parse" | "empty"): null {
  logProviderMiss({ provider, status, error, resultCount: 0 });
  return null;
}

async function searchBrave(
  query: string,
  apiKey: string,
  tried: string[],
): Promise<ResearchSources | null> {
  const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=5&search_lang=jp`;
  const loaded = await loadProvider(PROVIDER.brave, tried, url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-subscription-token": apiKey,
    },
  });
  if (!loaded) return null;
  try {
    const results = parseBraveWebSearch(JSON.parse(loaded.text) as unknown);
    if (results.length === 0) return missParsed(PROVIDER.brave, loaded.status, "empty");
    return { status: "ok", query, results };
  } catch {
    return missParsed(PROVIDER.brave, loaded.status, "parse");
  }
}

async function searchDuckDuckGoLite(
  query: string,
  tried: string[],
): Promise<ResearchSources | null> {
  const loaded = await loadProvider(PROVIDER.ddgLite, tried, DUCKDUCKGO_LITE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: query, kl: "jp-jp" }).toString(),
  });
  if (!loaded) return null;
  const results = parseDuckDuckGoLiteHtml(loaded.text);
  if (results.length === 0) return missParsed(PROVIDER.ddgLite, loaded.status, "empty");
  return { status: "ok", query, results };
}

async function searchDuckDuckGoHtml(
  query: string,
  tried: string[],
): Promise<ResearchSources | null> {
  const url = `${DUCKDUCKGO_HTML_URL}?q=${encodeURIComponent(query)}&kl=jp-jp`;
  const loaded = await loadProvider(PROVIDER.ddgHtml, tried, url, { method: "GET" });
  if (!loaded) return null;
  const results = parseDuckDuckGoHtml(loaded.text);
  if (results.length === 0) return missParsed(PROVIDER.ddgHtml, loaded.status, "empty");
  return { status: "ok", query, results };
}

async function searchBingHtml(query: string, tried: string[]): Promise<ResearchSources | null> {
  const url = `${BING_SEARCH_URL}?q=${encodeURIComponent(query)}&setlang=ja-JP`;
  const loaded = await loadProvider(PROVIDER.bing, tried, url, { method: "GET" });
  if (!loaded) return null;
  const results = parseBingHtml(loaded.text);
  if (results.length === 0) return missParsed(PROVIDER.bing, loaded.status, "empty");
  return { status: "ok", query, results };
}

async function searchDuckDuckGoInstant(
  query: string,
  tried: string[],
): Promise<ResearchSources | null> {
  const url = `${DUCKDUCKGO_INSTANT_URL}?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`;
  const loaded = await loadProvider(PROVIDER.instant, tried, url, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!loaded) return null;
  try {
    const results = parseDuckDuckGoInstantAnswer(JSON.parse(loaded.text) as unknown);
    if (results.length === 0) return missParsed(PROVIDER.instant, loaded.status, "empty");
    return { status: "ok", query, results };
  } catch {
    return missParsed(PROVIDER.instant, loaded.status, "parse");
  }
}

/**
 * Fail-soft web search: optional Brave (`SEARCH_API_KEY`), then DuckDuckGo Lite,
 * DuckDuckGo HTML, Bing HTML, and DuckDuckGo Instant Answer JSON.
 * HTML scrapers often return nothing from Cloudflare Workers; Brave is the reliable path.
 * Never throws. Misses are structured logs (provider, status or timeout, result count) with no secrets.
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

  const tried: string[] = [];
  const apiKey = opts.apiKey?.trim() ?? "";
  if (!apiKey) {
    logger.info("web search provider skipped", {
      provider: PROVIDER.brave,
      reason: "missing_api_key",
      resultCount: 0,
      hasSearchApiKey: false,
    });
  }

  const attempts: Array<() => Promise<ResearchSources | null>> = [];
  if (apiKey) attempts.push(() => searchBrave(query, apiKey, tried));
  attempts.push(() => searchDuckDuckGoLite(query, tried));
  attempts.push(() => searchDuckDuckGoHtml(query, tried));
  attempts.push(() => searchBingHtml(query, tried));
  attempts.push(() => searchDuckDuckGoInstant(query, tried));

  for (const attempt of attempts) {
    const found = await attempt();
    if (found) return { ...found, providersTried: [...tried] };
  }

  const reason = apiKey ? "all_providers_missed" : "no_search_api_key";
  logger.warn("web search failed", {
    providersTried: [...tried],
    resultCount: 0,
    reason,
    hasSearchApiKey: Boolean(apiKey),
  });
  return {
    ...emptyResearchSources(query, "failed"),
    providersTried: [...tried],
    reason,
  };
}
