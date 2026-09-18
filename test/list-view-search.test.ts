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
    });
    expect(serializeListViewSearch(parseListViewSearch(new URLSearchParams())).toString()).toBe("");
    expect(listViewHref(parseListViewSearch(new URLSearchParams()))).toBe("/app/list");
  });

  it("round-trips tab, view, query, stages, and tags", () => {
    const params = new URLSearchParams(
      "tab=aging&view=board&q=通勤&stage=ripe,selected&tag=音声,朝",
    );
    const parsed = parseListViewSearch(params);
    expect(parsed).toEqual({
      tab: "aging-shelf",
      view: "board",
      query: "通勤",
      stages: ["ripe", "selected"],
      tags: ["音声", "朝"],
    });
    expect(serializeListViewSearch(parsed).get("tab")).toBe("aging");
    expect(serializeListViewSearch(parsed).get("view")).toBe("board");
    expect(serializeListViewSearch(parsed).get("q")).toBe("通勤");
    expect(serializeListViewSearch(parsed).get("stage")).toBe("ripe,selected");
    expect(serializeListViewSearch(parsed).get("tag")).toBe("音声,朝");
    expect(parseListViewSearch(serializeListViewSearch(parsed))).toEqual(parsed);
    expect(listViewHref(parsed)).toContain("/app/list?");
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

  it("drops unknown stages and keeps a patch on top of current params", () => {
    const current = parseListViewSearch(new URLSearchParams("tab=aging&stage=nope,ripe"));
    expect(current.stages).toEqual(["ripe"]);
    expect(listViewHref(patchListViewSearch(current, { view: "board", tab: "all" }))).toBe(
      "/app/list?view=board&stage=ripe",
    );
  });
});
