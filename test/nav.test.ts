import { describe, expect, it } from "vitest";
import {
  isAnalyticsNavPath,
  isComposeNavPath,
  isInspirationNavPath,
  isListNavPath,
  isMobileNavActive,
  isMobileTabBarHidden,
  isSettingsNavPath,
  isWorkspaceNavActive,
  MOBILE_NAV,
  SETTINGS_NAV,
  WORKSPACE_NAV,
} from "../app/nav";

describe("nav destinations", () => {
  it("exposes analytics and inspirations as top-level workspace items", () => {
    expect(WORKSPACE_NAV.map((item) => item.to)).toEqual([
      "/app/list",
      "/app/inspirations",
      "/app/analytics",
    ]);
    expect(WORKSPACE_NAV.map((item) => item.label)).toEqual([
      "アイデア",
      "インスピレーション",
      "アナリティクス",
    ]);
    expect(SETTINGS_NAV.map((item) => item.to)).toEqual(["/app/settings"]);
    expect(WORKSPACE_NAV.some((item) => item.to.includes("merge"))).toBe(false);
    expect(WORKSPACE_NAV.some((item) => item.to.includes("research"))).toBe(false);
  });

  it("keeps list/inspirations/analytics on the mobile tab bar without 新規", () => {
    expect(MOBILE_NAV.map((item) => item.to)).toEqual([
      "/app/list",
      "/app/inspirations",
      "/app/analytics",
    ]);
    expect(MOBILE_NAV.map((item) => item.label)).toEqual(["一覧", "インスピ", "分析"]);
    expect(MOBILE_NAV.map((item) => item.ariaLabel)).toEqual([
      "一覧",
      "インスピレーション",
      "アナリティクス",
    ]);
    expect(MOBILE_NAV.map((item) => item.to)).not.toContain("/app");
    expect(MOBILE_NAV.map((item) => item.label)).not.toContain("新規");
    expect(MOBILE_NAV.map((item) => item.label)).not.toContain("設定");
    expect(MOBILE_NAV.some((item) => item.to.includes("merge"))).toBe(false);
  });
});

describe("nav path helpers", () => {
  it("classifies compose, list, inspiration, analytics, and settings paths", () => {
    expect(isComposeNavPath("/app")).toBe(true);
    expect(isComposeNavPath("/app/")).toBe(true);
    expect(isComposeNavPath("/app/capture")).toBe(true);
    expect(isComposeNavPath("/app/list")).toBe(false);
    expect(isListNavPath("/app/list")).toBe(true);
    expect(isListNavPath("/app/ideas/12")).toBe(true);
    expect(isListNavPath("/app/merge")).toBe(true);
    expect(isListNavPath("/app/research")).toBe(true);
    expect(isListNavPath("/app/inspirations")).toBe(false);
    expect(isInspirationNavPath("/app/inspirations")).toBe(true);
    expect(isInspirationNavPath("/app/inspirations/4")).toBe(true);
    expect(isInspirationNavPath("/app/list")).toBe(false);
    expect(isAnalyticsNavPath("/app/analytics")).toBe(true);
    expect(isAnalyticsNavPath("/app/analytics/")).toBe(true);
    expect(isAnalyticsNavPath("/app/settings")).toBe(false);
    expect(isSettingsNavPath("/app/settings")).toBe(true);
    expect(isSettingsNavPath("/app/team")).toBe(true);
  });

  it("hides the mobile tab bar on stack screens including compose", () => {
    expect(isMobileTabBarHidden("/app")).toBe(true);
    expect(isMobileTabBarHidden("/app/list")).toBe(false);
    expect(isMobileTabBarHidden("/app/inspirations")).toBe(false);
    expect(isMobileTabBarHidden("/app/analytics")).toBe(false);
    expect(isMobileTabBarHidden("/app/capture")).toBe(true);
    expect(isMobileTabBarHidden("/app/ideas/3")).toBe(true);
    expect(isMobileTabBarHidden("/app/inspirations/9")).toBe(true);
    expect(isMobileTabBarHidden("/app/settings")).toBe(true);
    expect(isMobileTabBarHidden("/app/merge")).toBe(true);
    expect(isMobileTabBarHidden("/app/research")).toBe(true);
  });

  it("marks the matching mobile tab active", () => {
    const list = MOBILE_NAV[0]!;
    const inspirations = MOBILE_NAV[1]!;
    const analytics = MOBILE_NAV[2]!;
    expect(isMobileNavActive(list, "/app/list")).toBe(true);
    expect(isMobileNavActive(list, "/app/ideas/1")).toBe(false);
    expect(isMobileNavActive(inspirations, "/app/inspirations")).toBe(true);
    expect(isMobileNavActive(inspirations, "/app/inspirations/2")).toBe(true);
    expect(isMobileNavActive(analytics, "/app/analytics")).toBe(true);
    expect(isMobileNavActive(analytics, "/app/settings")).toBe(false);
  });

  it("keeps idea detail under desktop アイデア, not analytics", () => {
    const list = WORKSPACE_NAV[0]!;
    const inspirations = WORKSPACE_NAV[1]!;
    const analytics = WORKSPACE_NAV[2]!;
    const settings = SETTINGS_NAV[0]!;
    expect(isWorkspaceNavActive(list, "/app/list")).toBe(true);
    expect(isWorkspaceNavActive(list, "/app/ideas/8")).toBe(true);
    expect(isWorkspaceNavActive(list, "/app/analytics")).toBe(false);
    expect(isWorkspaceNavActive(inspirations, "/app/inspirations/1")).toBe(true);
    expect(isWorkspaceNavActive(analytics, "/app/analytics")).toBe(true);
    expect(isWorkspaceNavActive(analytics, "/app/settings")).toBe(false);
    expect(isWorkspaceNavActive(settings, "/app/settings")).toBe(true);
    expect(isWorkspaceNavActive(settings, "/app/team")).toBe(true);
  });
});
