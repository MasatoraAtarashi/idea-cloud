import { describe, expect, it } from "vitest";
import {
  inspirationGlyph,
  inspirationHeadline,
  inspirationHostname,
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
});
