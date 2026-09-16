import { describe, expect, it } from "vitest";
import { IDEAS, STAGES } from "../app/data/mock";
import { NAV, NAV_GROUPS } from "../app/data/nav";

describe("empty product catalog", () => {
  it("ships no seed ideas", () => {
    expect(IDEAS).toEqual([]);
  });

  it("keeps the five aging stages", () => {
    expect([...STAGES]).toEqual(["spark", "aging", "ripe", "selected", "archived"]);
  });

  it("groups console nav without a public screen map", () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual(["ワークスペース", "設定"]);
    expect(NAV.map((item) => item.to)).toEqual([
      "/app/capture",
      "/app",
      "/app/merge",
      "/app/research",
      "/app/team",
    ]);
  });
});
