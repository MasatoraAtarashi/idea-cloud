import { describe, expect, it } from "vitest";
import {
  inspirationGlyph,
  inspirationHeadline,
  inspirationHostname,
  inspirationIdeaDraft,
  inspirationMediaHeight,
  inspirationSiteLabel,
  inspirationSnippet,
  inspirationTone,
} from "../app/lib/inspiration";

describe("inspiration display helpers", () => {
  it("prefers a human title, then og:title", () => {
    expect(
      inspirationHeadline({
        title: "駅のポスター",
        url: "https://example.com/poster",
        ogTitle: "Ignored page title",
      }),
    ).toBe("駅のポスター");
    expect(
      inspirationHeadline({
        title: "無題",
        url: "https://example.com/poster",
        ogTitle: "駅の光",
      }),
    ).toBe("駅の光");
    expect(
      inspirationHeadline({
        title: "http://www.sc-runner.com/2013/10/kinovea-tutorial.html",
        url: "http://www.sc-runner.com/2013/10/kinovea-tutorial.html",
      }),
    ).toBe("kinovea tutorial");
  });

  it("uses memo before og:description and a domain glyph for fallbacks", () => {
    expect(inspirationSnippet({ memo: "色が残る", ogDescription: "long marketing" })).toBe(
      "色が残る",
    );
    expect(inspirationSnippet({ memo: "", ogDescription: "long marketing" })).toBe(
      "long marketing",
    );
    expect(inspirationHostname("https://www.example.com/a")).toBe("www.example.com");
    expect(inspirationSiteLabel({ url: "https://example.com", ogSiteName: "Example" })).toBe(
      "Example",
    );
    expect(inspirationGlyph({ title: "無題", url: "https://github.com/x" })).toBe("G");
    expect(inspirationTone("github.com").bg).toMatch(/^#/);
  });

  it("keeps masonry heights stable and in range", () => {
    for (const id of ["1", "2", "3", "42", "1000"]) {
      const height = inspirationMediaHeight(id);
      expect(height).toBeGreaterThanOrEqual(100);
      expect(height).toBeLessThanOrEqual(180);
      expect(inspirationMediaHeight(id)).toBe(height);
    }
  });

  it("prefills an idea from a card with memo and a 参考 line", () => {
    expect(
      inspirationIdeaDraft({
        title: "寿司職人の予約サイト",
        url: "https://omakase.in/",
        memo: "店ではなく職人から選ぶ導線。",
        tags: ["寿司", "海外"],
      }),
    ).toEqual({
      title: "寿司職人の予約サイト",
      body: "店ではなく職人から選ぶ導線。\n\n参考: https://omakase.in/",
      tags: ["寿司", "海外"],
    });
    expect(inspirationIdeaDraft({ title: "メモ", url: null, memo: "", tags: [] }).body).toBe("");
  });
});
