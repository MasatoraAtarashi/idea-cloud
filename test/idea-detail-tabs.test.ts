import { describe, expect, it } from "vitest";
import {
  hashForIdeaDetailTab,
  ideaDetailTabFromHash,
  IDEA_DETAIL_TAB_LABEL,
} from "../app/lib/idea-detail-tabs";

describe("idea detail tabs", () => {
  it("maps hashes onto 概要 / リサーチ / AI/履歴 / 相談 / コメント", () => {
    expect(ideaDetailTabFromHash("")).toBe("overview");
    expect(ideaDetailTabFromHash("#research")).toBe("research");
    expect(ideaDetailTabFromHash("brainstorm")).toBe("ai");
    expect(ideaDetailTabFromHash("#evaluate")).toBe("ai");
    expect(ideaDetailTabFromHash("#history")).toBe("ai");
    expect(ideaDetailTabFromHash("#discuss")).toBe("discuss");
    expect(ideaDetailTabFromHash("#comments")).toBe("comments");
    expect(IDEA_DETAIL_TAB_LABEL.overview).toBe("概要");
    expect(IDEA_DETAIL_TAB_LABEL.ai).toBe("AI/履歴");
    expect(IDEA_DETAIL_TAB_LABEL.discuss).toBe("相談");
    expect(hashForIdeaDetailTab("overview")).toBe("");
    expect(hashForIdeaDetailTab("ai")).toBe("history");
    expect(hashForIdeaDetailTab("discuss")).toBe("discuss");
    expect(hashForIdeaDetailTab("research")).toBe("research");
  });
});
