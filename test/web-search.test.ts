import { afterEach, describe, expect, it, vi } from "vitest";
import { serializeResearchSources } from "../app/lib/research-sources";
import {
  DUCKDUCKGO_LITE_URL,
  searchWebSources,
  setTestSearchFetch,
  setTestWebSearch,
  setTestWebSearchTimeout,
} from "../server/ai/web-search";

const LITE_HTML = `
<table>
  <tr>
    <td>
      <a rel="nofollow" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fmemo" class='result-link'>音声メモ</a>
    </td>
  </tr>
  <tr><td class='result-snippet'>朝に整理する。</td></tr>
</table>
`;

const headerValue = "aaaa";

const BRAVE_JSON = JSON.stringify({
  web: {
    results: [{ title: "Brave hit", url: "https://example.com/brave", description: "from brave" }],
  },
});

function warnPayloads(spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] {
  return spy.mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>);
}

describe("web search provider logs", () => {
  afterEach(() => {
    setTestWebSearch();
    setTestSearchFetch();
    setTestWebSearchTimeout();
    vi.restoreAllMocks();
  });

  it("logs each miss and stores providersTried when every provider returns nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    setTestWebSearch();
    setTestSearchFetch(async (url) => {
      if (url.includes("lite.duckduckgo.com"))
        return new Response("<html></html>", { status: 200 });
      if (url.includes("html.duckduckgo.com")) return new Response("blocked", { status: 403 });
      if (url.includes("bing.com")) return new Response("no", { status: 429 });
      return new Response("not-json", { status: 200 });
    });

    const sources = await searchWebSources({ query: "音声メモ" });
    expect(sources.status).toBe("failed");
    expect(sources.results).toEqual([]);
    expect(sources.providersTried).toEqual([
      "duckduckgo_lite",
      "duckduckgo_html",
      "bing",
      "duckduckgo_instant",
    ]);
    expect(sources.reason).toBe("no_search_api_key");

    const warnings = warnPayloads(warn);
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "web search provider miss",
          provider: "duckduckgo_lite",
          status: 200,
          error: "empty",
          resultCount: 0,
        }),
        expect.objectContaining({
          msg: "web search provider miss",
          provider: "duckduckgo_html",
          status: 403,
          error: "http",
          resultCount: 0,
        }),
        expect.objectContaining({
          msg: "web search provider miss",
          provider: "bing",
          status: 429,
          error: "http",
          resultCount: 0,
        }),
        expect.objectContaining({
          msg: "web search provider miss",
          provider: "duckduckgo_instant",
          status: 200,
          error: "parse",
          resultCount: 0,
        }),
        expect.objectContaining({
          msg: "web search failed",
          resultCount: 0,
          reason: "no_search_api_key",
        }),
      ]),
    );
    const infos = warnPayloads(info);
    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "web search provider skipped",
          provider: "brave",
          reason: "missing_api_key",
        }),
      ]),
    );
    const logged = JSON.stringify([...warnings, ...infos]);
    expect(logged).not.toContain("SEARCH_API_KEY");
    expect(JSON.parse(serializeResearchSources(sources)).reason).toBe("no_search_api_key");
  });

  it("logs a Brave HTTP miss without the key, then accepts DuckDuckGo Lite", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setTestWebSearch();
    setTestSearchFetch(async (url, init) => {
      const headers = new Headers(init.headers);
      expect(headers.get("accept-language")).toContain("ja");
      if (url.includes("api.search.brave.com")) {
        expect(headers.get("x-subscription-token")).toBe(headerValue);
        return new Response("nope", { status: 401 });
      }
      if (url === DUCKDUCKGO_LITE_URL) {
        expect(init.method).toBe("POST");
        expect(String(init.body)).toContain("kl=jp-jp");
        return new Response(LITE_HTML, { status: 200 });
      }
      return new Response("", { status: 500 });
    });

    const sources = await searchWebSources({ query: "音声メモ", apiKey: headerValue });
    expect(sources.status).toBe("ok");
    expect(sources.results[0]?.url).toBe("https://example.com/memo");
    expect(sources.providersTried).toEqual(["brave", "duckduckgo_lite"]);
    const warnings = warnPayloads(warn);
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "brave",
          status: 401,
          error: "http",
          resultCount: 0,
        }),
      ]),
    );
    expect(JSON.stringify(warnings)).not.toContain(headerValue);
  });

  it("logs timeout when a provider aborts", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setTestWebSearch();
    setTestWebSearchTimeout(20);
    setTestSearchFetch(async (url, init) => {
      if (url.includes("api.search.brave.com")) {
        await new Promise((_resolve, reject) => {
          const fail = () => reject(new DOMException("The operation was aborted", "AbortError"));
          if (init.signal?.aborted) fail();
          else init.signal?.addEventListener("abort", fail, { once: true });
        });
      }
      if (url.includes("lite.duckduckgo.com")) return new Response(LITE_HTML, { status: 200 });
      return new Response("", { status: 500 });
    });

    const sources = await searchWebSources({ query: "音声メモ", apiKey: headerValue });
    expect(sources.results[0]?.url).toBe("https://example.com/memo");
    expect(warnPayloads(warn)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "brave",
          status: null,
          error: "timeout",
          resultCount: 0,
        }),
      ]),
    );
  });

  it("uses Brave JSON when the key is accepted", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setTestWebSearch();
    setTestSearchFetch(async () => new Response(BRAVE_JSON, { status: 200 }));
    const sources = await searchWebSources({ query: "音声メモ", apiKey: headerValue });
    expect(sources.status).toBe("ok");
    expect(sources.results[0]?.url).toBe("https://example.com/brave");
    expect(sources.providersTried).toEqual(["brave"]);
    expect(warn).not.toHaveBeenCalled();
  });
});
