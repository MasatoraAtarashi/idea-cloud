import { describe, expect, it } from "vitest";
import {
  listViewHref,
  parseListViewSearch,
  patchListViewSearch,
  serializeListViewSearch,
} from "../app/lib/list-view-search";

describe("list view search params", () => {
  it("omits defaults so /app/list is the all/table view", () => {
    expect(parseListViewSearch(new URLSearchParams())).toEqual({
      tab: "all",
      view: "table",
      query: "",
      stages: [],
      tags: [],
      minDays: 0,
      savedViewId: null,
    });
    expect(serializeListViewSearch(parseListViewSearch(new URLSearchParams())).toString()).toBe("");
    expect(listViewHref(parseListViewSearch(new URLSearchParams()))).toBe("/app/list");
  });

  it("round-trips tab, view, query, stages, tags, aged days, and saved view id", async () => {
    const params = new URLSearchParams(
      "tab=aging&view=board&q=通勤&stage=ripe,selected&tag=音声,朝&days=14&v=4",
    );
    const parsed = parseListViewSearch(params);
    expect(parsed).toEqual({
      tab: "aging-shelf",
      view: "board",
      query: "通勤",
      stages: ["ripe", "selected"],
      tags: ["音声", "朝"],
      minDays: 14,
      savedViewId: 4,
    });
    expect(serializeListViewSearch(parsed).get("tab")).toBe("aging");
    expect(serializeListViewSearch(parsed).get("view")).toBe("board");
    expect(serializeListViewSearch(parsed).get("q")).toBe("通勤");
    expect(serializeListViewSearch(parsed).get("stage")).toBe("ripe,selected");
    expect(serializeListViewSearch(parsed).get("tag")).toBe("音声,朝");
    expect(serializeListViewSearch(parsed).get("days")).toBe("14");
    expect(serializeListViewSearch(parsed).get("v")).toBe("4");
    expect(parseListViewSearch(serializeListViewSearch(parsed))).toEqual(parsed);
    expect(listViewHref(parsed)).toContain("/app/list?");
  });

  it("keeps a custom aged-days minimum in the URL", () => {
    const parsed = parseListViewSearch(new URLSearchParams("days=21"));
    expect(parsed.minDays).toBe(21);
    expect(serializeListViewSearch(parsed).get("days")).toBe("21");
    expect(listViewHref(parsed)).toBe("/app/list?days=21");
    expect(parseListViewSearch(new URLSearchParams("days=nope")).minDays).toBe(0);
  });

  it("round-trips 熟成候補 and 試したアイデア tabs", () => {
    const candidates = parseListViewSearch(new URLSearchParams("tab=candidates&days=14"));
    expect(candidates.tab).toBe("candidates");
    expect(candidates.minDays).toBe(14);
    expect(serializeListViewSearch(candidates).get("tab")).toBe("candidates");
    expect(listViewHref(candidates)).toBe("/app/list?tab=candidates&days=14");
    const tried = parseListViewSearch(new URLSearchParams("tab=tried"));
    expect(tried.tab).toBe("tried");
    expect(serializeListViewSearch(tried).get("tab")).toBe("tried");
    expect(listViewHref(tried)).toBe("/app/list?tab=tried");
  });

  it("accepts repeated keys and aging-shelf as aliases", () => {
    const params = new URLSearchParams();
    params.append("tab", "aging-shelf");
    params.append("stage", "spark");
    params.append("stage", "aging");
    params.append("tag", "メモ");
    const parsed = parseListViewSearch(params);
    expect(parsed.tab).toBe("aging-shelf");
    expect(parsed.stages).toEqual(["spark", "aging"]);
    expect(parsed.tags).toEqual(["メモ"]);
  });

  it("drops unknown stages and clears saved view id when filters change", () => {
    const current = parseListViewSearch(new URLSearchParams("tab=aging&stage=nope,ripe&v=9"));
    expect(current.stages).toEqual(["ripe"]);
    expect(current.savedViewId).toBe(9);
    expect(listViewHref(patchListViewSearch(current, { view: "board", tab: "all" }))).toBe(
      "/app/list?view=board&stage=ripe",
    );
    expect(
      listViewHref(
        patchListViewSearch(current, {
          view: "board",
          tab: "all",
          savedViewId: 9,
        }),
      ),
    ).toBe("/app/list?view=board&stage=ripe&v=9");
  });
});
