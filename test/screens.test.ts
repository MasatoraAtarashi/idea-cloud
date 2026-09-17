import { describe, expect, it } from "vitest";
import { ACCESS_NAV, MOBILE_NAV, WORKSPACE_NAV } from "../app/nav";
import { homePath, isDesktopViewport, CAPTURE_PATH, LIST_PATH } from "../app/lib/home-path";
import {
  allTags,
  filterIdeas,
  IDEAS,
  MEMBERS,
  SESSION_USER,
  STAGE_LABEL,
  STAGES,
  type MockIdea,
} from "../app/data/mock";

const appSources = import.meta.glob("../app/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const DEMO_STRINGS = [
  "通勤の音声メモを、次の朝に構造化する",
  "『よく忘れる』をチームの公式ルールにする",
  "Workers AI で安いタグ付けと関係抽出",
  "金曜の『熟した棚』レビュー",
  "捨てる儀式を、採用より丁寧に",
  "佐藤 めい",
  "田中 海",
  "mei@example.com",
];

describe("empty workspace data", () => {
  it("ships no preloaded ideas or invented teammates", () => {
    expect(IDEAS).toEqual([]);
    expect(MEMBERS).toEqual([]);
    expect(allTags()).toEqual([]);
    expect(SESSION_USER.label).toBe("ログイン中");
  });

  it("does not render retired dummy idea or teammate copy in the app", () => {
    const src = Object.values(appSources).join("\n");
    for (const needle of DEMO_STRINGS) {
      expect(src).not.toContain(needle);
    }
  });

  it("keeps Japanese aging stages for filters and empty board columns", () => {
    expect([...STAGES]).toEqual(["spark", "aging", "ripe", "selected", "archived"]);
    expect(STAGE_LABEL.spark).toBe("着想");
    expect(STAGE_LABEL.aging).toBe("熟成中");
    expect(STAGE_LABEL.ripe).toBe("熟した");
    expect(STAGE_LABEL.selected).toBe("採用");
    expect(STAGE_LABEL.archived).toBe("アーカイブ");
  });

  it("filters ephemeral ideas without relying on shipped rows", () => {
    const sample: MockIdea[] = [
      {
        id: "tmp",
        title: "一時データ",
        body: "テスト用",
        stage: "spark",
        tags: ["検証"],
        author: "",
        team: "",
        createdAt: "2026-09-16",
        agedDays: 0,
        relatedIds: [],
      },
    ];
    expect(filterIdeas(sample, { query: "一時", stages: ["spark"], tags: [] })).toHaveLength(1);
    expect(filterIdeas(sample, { query: "ない", stages: [], tags: [] })).toHaveLength(0);
    expect(filterIdeas(sample, { query: "", stages: ["ripe"], tags: [] })).toHaveLength(0);
  });
});

describe("responsive home and nav", () => {
  it("sends mobile to capture and desktop to list", () => {
    expect(homePath(false)).toBe(CAPTURE_PATH);
    expect(homePath(true)).toBe(LIST_PATH);
    expect(CAPTURE_PATH).toBe("/app");
    expect(LIST_PATH).toBe("/app/list");
    expect(isDesktopViewport(() => ({ matches: false }))).toBe(false);
    expect(isDesktopViewport(() => ({ matches: true }))).toBe(true);
  });

  it("puts capture first on mobile nav and list first on desktop nav", () => {
    expect(MOBILE_NAV[0]?.to).toBe("/app");
    expect(MOBILE_NAV[0]?.primary).toBe(true);
    expect(MOBILE_NAV.map((item) => item.label)).toEqual(["取る", "一覧", "融合", "研究", "設定"]);
    expect(MOBILE_NAV[1]?.to).toBe("/app/list");
    expect(WORKSPACE_NAV[0]?.to).toBe("/app/list");
    expect(ACCESS_NAV[0]?.to).toBe("/app/team");
  });
});
