import { errorClass, hostOnly, logDiag, statusFromError } from "../diag";
import { parseOpenGraphHtml, type ParsedOpenGraph } from "./parse";
import { assertPublicHttpUrl, PublicUrlRejectedError } from "./url";

export const OGP_FETCH_TIMEOUT_MS = 5_000;
export const OGP_HTML_MAX_BYTES = 512 * 1024;
export const OGP_MAX_REDIRECTS = 3;

export type OgStatus = "none" | "ok" | "failed";

export type OpenGraphResult = {
  status: OgStatus;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  fetchedAt: string | null;
};

export type OpenGraphFields = {
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
  ogFetchedAt: string | null;
  ogStatus: OgStatus;
};

const EMPTY_PARSED: ParsedOpenGraph = {
  title: "",
  description: "",
  imageUrl: "",
  siteName: "",
};

type HtmlFetch = (url: string, init: RequestInit) => Promise<Response>;

let testOgpFetch: ((url: string) => Promise<OpenGraphResult>) | undefined;
let testHtmlFetch: HtmlFetch | undefined;

/** Test-only. Production always fetches the page when a URL is present. */
export function setTestOgpFetch(run?: (url: string) => Promise<OpenGraphResult>) {
  testOgpFetch = run;
}

/** Test-only HTML transport for parse + SSRF integration. */
export function setTestOgpHtmlFetch(run?: HtmlFetch) {
  testHtmlFetch = run;
}

export function emptyOpenGraph(status: OgStatus = "none"): OpenGraphResult {
  return {
    status,
    ...EMPTY_PARSED,
    fetchedAt: status === "none" ? null : nowStamp(),
  };
}

export function openGraphFields(result: OpenGraphResult): OpenGraphFields {
  return {
    ogTitle: result.title,
    ogDescription: result.description,
    ogImageUrl: result.imageUrl,
    ogSiteName: result.siteName,
    ogFetchedAt: result.fetchedAt,
    ogStatus: result.status,
  };
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function failed(): OpenGraphResult {
  return emptyOpenGraph("failed");
}

async function readHtmlLimited(response: Response, maxBytes: number): Promise<string> {
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

async function followPublicUrl(start: string): Promise<{ url: string; html: string }> {
  const transport = testHtmlFetch ?? fetch;
  let current = assertPublicHttpUrl(start).href;

  for (let hop = 0; hop <= OGP_MAX_REDIRECTS; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OGP_FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await transport(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "user-agent": "IdeaCloudOGP/1.0",
        },
      });
    } catch (error) {
      if (error instanceof PublicUrlRejectedError) throw error;
      throw new Error(error instanceof Error && error.name === "AbortError" ? "timeout" : "fetch");
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect");
      current = assertPublicHttpUrl(new URL(location, current).href).href;
      continue;
    }

    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType && !contentType.includes("html") && !contentType.includes("xml")) {
      throw new Error("content-type");
    }
    const html = await readHtmlLimited(response, OGP_HTML_MAX_BYTES);
    return { url: current, html };
  }

  throw new Error("too many redirects");
}

export async function fetchOpenGraph(rawUrl: string | null | undefined): Promise<OpenGraphResult> {
  const url = rawUrl?.trim() ?? "";
  if (!url) return emptyOpenGraph("none");

  if (testOgpFetch) {
    try {
      return await testOgpFetch(url);
    } catch (error) {
      logDiag("warn", "ogp fetch", {
        step: "ogp",
        provider: "ogp",
        outcome: "fail",
        error: errorClass(error),
        status: statusFromError(error),
        host: hostOnly(url),
      });
      return failed();
    }
  }

  try {
    assertPublicHttpUrl(url);
  } catch (error) {
    logDiag("warn", "ogp fetch", {
      step: "ogp",
      provider: "ogp",
      outcome: "fail",
      error: errorClass(error),
      status: null,
      host: hostOnly(url),
    });
    return failed();
  }

  try {
    const { url: finalUrl, html } = await followPublicUrl(url);
    const parsed = parseOpenGraphHtml(html, finalUrl);
    const hasAnything = Boolean(
      parsed.title || parsed.description || parsed.imageUrl || parsed.siteName,
    );
    if (!hasAnything) {
      logDiag("warn", "ogp fetch", {
        step: "ogp",
        provider: "ogp",
        outcome: "fail",
        error: "empty",
        status: 200,
        host: hostOnly(finalUrl),
      });
    }
    return {
      status: hasAnything ? "ok" : "failed",
      title: parsed.title,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      siteName: parsed.siteName,
      fetchedAt: nowStamp(),
    };
  } catch (error) {
    logDiag("warn", "ogp fetch", {
      step: "ogp",
      provider: "ogp",
      outcome: "fail",
      error: errorClass(error),
      status: statusFromError(error),
      host: hostOnly(url),
    });
    return failed();
  }
}
