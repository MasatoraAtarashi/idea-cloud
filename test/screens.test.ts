import { describe, expect, it } from "vitest";
import { MOBILE_NAV, SETTINGS_NAV, WORKSPACE_NAV } from "../app/nav";
import { homePath, isDesktopViewport, NEW_IDEA_PATH, LIST_PATH } from "../app/lib/home-path";
import { isNewIdeaShortcut, isSubmitShortcut } from "../app/lib/shortcuts";
import { formatRelativeJa, ideaExcerpt, ideaPublicId } from "../app/lib/format";
import { DESIGN_TOKENS, STAGE_PILL_HEX } from "../app/lib/tokens";
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

const appSources = import.meta.glob(["../app/**/*.{ts,tsx,css}"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const faviconSvg = Object.values(
  import.meta.glob(["../public/favicon.svg"], {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>,
).join("\n");

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

  it("uses new-idea compose copy instead of キャプチャ", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("いま思いついたこと");
    expect(src).toContain("新規アイデア");
    expect(src).toContain("作成");
    expect(src).toContain("閉じる");
    expect(src).toContain('method="post"');
    expect(src).not.toContain("キャプチャ");
    expect(src).not.toContain("置く");
    expect(src).not.toContain('label: "取る"');
    expect(src).not.toContain("まだ保存していません");
  });

  it("loads list and detail from D1 instead of the empty mock array", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("listIdeaViews");
    expect(src).toContain("getIdeaView");
    expect(src).toContain("createIdeaAction");
    expect(src).toContain("resolveCreateTags");
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
  it("sends mobile to compose and desktop to list", () => {
    expect(homePath(false)).toBe(NEW_IDEA_PATH);
    expect(homePath(true)).toBe(LIST_PATH);
    expect(NEW_IDEA_PATH).toBe("/app");
    expect(LIST_PATH).toBe("/app/list");
    expect(isDesktopViewport(() => ({ matches: false }))).toBe(false);
    expect(isDesktopViewport(() => ({ matches: true }))).toBe(true);
  });

  it("keeps list + new + settings on mobile and list-only workspace on desktop", () => {
    expect(MOBILE_NAV.map((item) => item.label)).toEqual(["一覧", "新規", "設定"]);
    expect(MOBILE_NAV[1]?.to).toBe("/app");
    expect(MOBILE_NAV[1]?.primary).toBe(true);
    expect(WORKSPACE_NAV.map((item) => item.label)).toEqual(["アイデア"]);
    expect(WORKSPACE_NAV[0]?.to).toBe("/app/list");
    expect(SETTINGS_NAV[0]?.to).toBe("/app/settings");
    expect(WORKSPACE_NAV.some((item) => item.to.includes("merge"))).toBe(false);
    expect(WORKSPACE_NAV.some((item) => item.to.includes("research"))).toBe(false);
    expect(MOBILE_NAV.some((item) => item.to.includes("merge"))).toBe(false);
    expect(MOBILE_NAV.some((item) => item.to.includes("research"))).toBe(false);
  });

  it("keeps empty list chrome instead of hiding the view frame", () => {
    const src = appSources["../app/components/idea-list-view.tsx"];
    expect(src).toContain("ui-table");
    expect(src).toContain("フィルタ");
    expect(src).toContain("まだアイデアがありません");
    expect(src).toContain("テーブル");
    expect(src).toContain("ボード");
    expect(src).toContain("useListViewSearch");
    expect(src).toContain('hrefFor({ tab: "aging-shelf" })');
    expect(src).not.toContain("emptyWorkspace");
  });

  it("surfaces merge and research as per-idea actions", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("IdeaActionsMenu");
    expect(src).toContain("/app/merge?from=");
    expect(src).toContain("#research");
    expect(src).toContain("速い・安い");
    expect(src).toContain("標準");
    expect(src).toContain("じっくり");
    expect(src).toContain("実行");
    expect(src).toContain("researchIdeaAction");
    expect(src).toContain("ideaDetailAction");
    expect(src).toContain("autoSubmit");
  });
});

describe("desktop compose shortcuts and brand", () => {
  it("treats mod+N as new idea and mod+Enter as submit", () => {
    expect(isNewIdeaShortcut({ key: "n", metaKey: true, ctrlKey: false })).toBe(true);
    expect(isNewIdeaShortcut({ key: "n", metaKey: false, ctrlKey: true })).toBe(true);
    expect(isNewIdeaShortcut({ key: "n", metaKey: true, ctrlKey: false, isComposing: true })).toBe(
      false,
    );
    expect(isSubmitShortcut({ key: "Enter", metaKey: true, ctrlKey: false })).toBe(true);
    expect(isSubmitShortcut({ key: "Enter", metaKey: false, ctrlKey: true })).toBe(true);
    expect(isSubmitShortcut({ key: "Enter", metaKey: false, ctrlKey: false })).toBe(false);
  });

  it("ships an original brand mark and quiet JP/Latin/mono stack", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("BrandMark");
    expect(src).toContain("/favicon.svg");
    expect(src).toContain("/favicon.ico");
    expect(src).toContain("/apple-touch-icon.png");
    expect(src).toContain("--brand-spark");
    expect(src).toContain("Noto+Sans+JP:wght@400;500");
    expect(src).not.toContain("Noto+Sans+JP:wght@400;500;600");
    expect(src).toContain("IBM+Plex+Mono");
    expect(src).toContain("stage-spark");
    expect(src).toContain("ui-title");
    expect(src).toContain("px-4 py-2");
    expect(src).not.toContain("height: 52px");
    expect(DESIGN_TOKENS.accent).toBe("#3b6ef6");
    expect(DESIGN_TOKENS.sidebar).toBe("#fafafb");
    expect(DESIGN_TOKENS.rowHeight).toBe(40);
    expect(STAGE_PILL_HEX.spark.bg).toBe("#f3f0ff");
    expect(STAGE_PILL_HEX.aging.fg).toBe("#b45309");
    expect(faviconSvg).toContain("#3B6EF6");
    expect(faviconSvg).toContain("#FFFFFF");
    expect(faviconSvg).toContain("M8.4 24.2c-3.4 0-6.15-2.55-6.15-5.7");
    expect(faviconSvg).toContain("M24.6 1.6 26.2 6.2 30.8 7.8");
    expect(appSources["../app/components/brand.tsx"]).toContain(
      "M8.4 24.2c-3.4 0-6.15-2.55-6.15-5.7",
    );
  });
});

describe("display helpers", () => {
  it("formats ids, excerpts, and relative time", () => {
    expect(ideaPublicId("142")).toBe("IC-142");
    expect(
      ideaExcerpt({
        id: "1",
        title: "見出し",
        body: "見出し\n本文の続き",
        stage: "spark",
        tags: [],
        author: "",
        team: "",
        createdAt: "2026-09-16",
        agedDays: 2,
        relatedIds: [],
      }),
    ).toBe("本文の続き");
    expect(formatRelativeJa("2026-09-18T02:00:00Z", Date.parse("2026-09-18T02:00:30Z"))).toBe(
      "たった今",
    );
  });
});
