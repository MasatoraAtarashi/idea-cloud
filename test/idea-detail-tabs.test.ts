import { describe, expect, it } from "vitest";
import {
  hashForIdeaDetailTab,
  hashTargetsAi,
  ideaDetailTabFromHash,
  IDEA_DETAIL_TAB_LABEL,
} from "../app/lib/idea-detail-tabs";

describe("idea detail tabs", () => {
  it("maps hashes onto the AI 作業台 tabs 相談 / 評価 / リサーチ / ブレスト", () => {
    expect(ideaDetailTabFromHash("")).toBe("discuss");
    expect(ideaDetailTabFromHash("#discuss")).toBe("discuss");
    expect(ideaDetailTabFromHash("#evaluate")).toBe("evaluate");
    expect(ideaDetailTabFromHash("#research")).toBe("research");
    expect(ideaDetailTabFromHash("brainstorm")).toBe("brainstorm");
    expect(ideaDetailTabFromHash("#history")).toBe("evaluate");
    expect(ideaDetailTabFromHash("#nope")).toBe("discuss");
    expect(IDEA_DETAIL_TAB_LABEL.discuss).toBe("相談");
    expect(IDEA_DETAIL_TAB_LABEL.evaluate).toBe("評価");
    expect(hashForIdeaDetailTab("discuss")).toBe("discuss");
  });

  it("keeps older five-tab hashes working", () => {
    expect(ideaDetailTabFromHash("#overview")).toBe("discuss");
    expect(ideaDetailTabFromHash("#comments")).toBe("discuss");
    expect(ideaDetailTabFromHash("#ai")).toBe("evaluate");
  });

  it("opens the mobile AI side only for explicit AI hashes", () => {
    expect(hashTargetsAi("")).toBe(false);
    expect(hashTargetsAi("#comments")).toBe(false);
    expect(hashTargetsAi("#discuss")).toBe(true);
    expect(hashTargetsAi("#research")).toBe(true);
  });
});
