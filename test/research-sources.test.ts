import { describe, expect, it } from "vitest";
import {
  buildSearchQuery,
  emptyResearchSources,
  formatResearchUserText,
  mergeResearchSources,
  parseBingHtml,
  parseBraveWebSearch,
  parseDuckDuckGoHtml,
  parseDuckDuckGoInstantAnswer,
  parseResearchSources,
  researchSourcesForDisplay,
  sanitizeResearchSource,
  serializeResearchSources,
  unwrapDuckDuckGoUrl,
  WEB_SEARCH_UNAVAILABLE_LABEL,
} from "../app/lib/research-sources";

const DDG_HTML = `
<div class="result results_links">
  <h2 class="result__title">
    <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fmemo-app">音声メモアプリの先行事例</a>
  </h2>
  <a class="result__snippet" href="https://example.com/memo-app">朝に構造化するメモ製品の紹介。</a>
</div>
<div class="result results_links">
  <a class="result__a" href="https://example.org/notes">別のノートアプリ</a>
  <div class="result__snippet">チーム向けのノート。</div>
</div>
<div class="result results_links">
  <a class="result__a" href="https://html.duckduckgo.com/html/">検索エンジン自身</a>
</div>
`;

const BING_HTML = `
<ol>
  <li class="b_algo">
    <h2><a href="https://example.net/voice" h="ID">Voice inbox</a></h2>
    <p>Capture speech overnight.</p>
  </li>
  <li class="b_algo">
    <h2><a href="https://127.0.0.1/private">Private</a></h2>
    <p>should drop</p>
  </li>
</ol>
`;

describe("research source parse / merge helpers", () => {
  it("builds a Japanese prior-art query from the title", () => {
    expect(buildSearchQuery("通勤の音声メモ", "本文")).toBe("通勤の音声メモ 先行事例");
    expect(buildSearchQuery("無題", "最初の行\n続き")).toBe("最初の行 先行事例");
    expect(buildSearchQuery("既に 先行事例", "")).toBe("既に 先行事例");
    expect(buildSearchQuery("   ", "   ")).toBe("");
  });

  it("unwraps DuckDuckGo redirect links and drops search-engine hosts", () => {
    expect(
      unwrapDuckDuckGoUrl("https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpath"),
    ).toBe("https://example.com/path");
    expect(sanitizeResearchSource({ title: "DDG", url: "https://duckduckgo.com/" })).toBeNull();
    expect(sanitizeResearchSource({ title: "loop", url: "https://127.0.0.1/" })).toBeNull();
  });

  it("parses DuckDuckGo HTML results and dedupes", () => {
    const parsed = parseDuckDuckGoHtml(DDG_HTML);
    expect(parsed).toEqual([
      {
        title: "音声メモアプリの先行事例",
        url: "https://example.com/memo-app",
        snippet: "朝に構造化するメモ製品の紹介。",
      },
      {
        title: "別のノートアプリ",
        url: "https://example.org/notes",
        snippet: "チーム向けのノート。",
      },
    ]);
  });

  it("parses Bing HTML and skips private URLs", () => {
    expect(parseBingHtml(BING_HTML)).toEqual([
      {
        title: "Voice inbox",
        url: "https://example.net/voice",
        snippet: "Capture speech overnight.",
      },
    ]);
  });

  it("parses Brave JSON and DuckDuckGo Instant Answer", () => {
    expect(
      parseBraveWebSearch({
        web: {
          results: [
            {
              title: "Brave hit",
              url: "https://example.com/brave",
              description: "from brave",
            },
            { title: "dup", url: "https://example.com/brave/", snippet: "again" },
          ],
        },
      }),
    ).toEqual([{ title: "Brave hit", url: "https://example.com/brave", snippet: "from brave" }]);

    const instant = parseDuckDuckGoInstantAnswer({
      Heading: "Idea",
      AbstractURL: "https://en.wikipedia.org/wiki/Idea",
      AbstractText: "A thought or suggestion.",
      RelatedTopics: [
        {
          Topics: [
            {
              FirstURL: "https://example.com/related",
              Text: "Related - extra context",
            },
          ],
        },
      ],
    });
    expect(instant.map((item) => item.url)).toEqual([
      "https://en.wikipedia.org/wiki/Idea",
      "https://example.com/related",
    ]);
  });

  it("merges batches, caps at 5, and serializes failed empty sets", () => {
    const extra = Array.from({ length: 6 }, (_, index) => ({
      title: `Item ${index}`,
      url: `https://example.com/${index}`,
      snippet: "",
    }));
    const merged = mergeResearchSources([[extra[0]!], extra.slice(1)]);
    expect(merged).toHaveLength(5);
    expect(merged[0]?.url).toBe("https://example.com/0");

    const failed = emptyResearchSources("q", "failed");
    expect(JSON.parse(serializeResearchSources(failed))).toEqual({
      status: "failed",
      query: "q",
      results: [],
    });
    expect(parseResearchSources('{"status":"ok","query":"x","results":[]}')?.status).toBe("failed");
    expect(parseResearchSources("not-json")).toBeNull();
  });

  it("formats the model prompt with real URLs only and display fallback copy", () => {
    const withLinks = formatResearchUserText("本文", {
      status: "ok",
      query: "本文 先行事例",
      results: [
        {
          title: "事例",
          url: "https://example.com/hit",
          snippet: "短い説明",
        },
      ],
    });
    expect(withLinks).toContain("https://example.com/hit");
    expect(withLinks).toContain("短い説明");

    const missing = formatResearchUserText("本文", emptyResearchSources("q", "failed"));
    expect(missing).toContain("取得できませんでした");
    expect(missing).not.toContain("https://");

    expect(
      researchSourcesForDisplay({
        researchedAt: "2026-09-21",
        researchNotes: "観点",
        researchSources: null,
      })?.status,
    ).toBe("failed");
    expect(WEB_SEARCH_UNAVAILABLE_LABEL).toBe("Web検索未取得");
  });
});
