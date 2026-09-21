import { describe, expect, it } from "vitest";
import { MOBILE_NAV, SETTINGS_NAV, WORKSPACE_NAV } from "../app/nav";
import {
  homePath,
  homePathForClient,
  isDesktopViewport,
  isMobileUserAgent,
  prefersComposeHome,
  NEW_IDEA_PATH,
  LIST_PATH,
} from "../app/lib/home-path";
import { COMPOSE_URL_HINT } from "../app/lib/compose";
import { isNewIdeaShortcut, isSubmitShortcut } from "../app/lib/shortcuts";
import { formatRelativeJa, ideaExcerpt, ideaPublicId } from "../app/lib/format";
import { DESIGN_TOKENS, STAGE_PILL_HEX } from "../app/lib/tokens";
import {
  allTags,
  filterIdeas,
  IDEAS,
  MEMBERS,
  nextStage,
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
    expect(src).toContain("listCommentsForIdea");
    expect(src).toContain("insertIdeaComment");
  });

  it("keeps Japanese aging stages for filters and empty board columns", () => {
    expect([...STAGES]).toEqual(["spark", "aging", "ripe", "selected", "archived"]);
    expect(STAGE_LABEL.spark).toBe("着想");
    expect(STAGE_LABEL.aging).toBe("熟成中");
    expect(STAGE_LABEL.ripe).toBe("熟した");
    expect(STAGE_LABEL.selected).toBe("採用");
    expect(STAGE_LABEL.archived).toBe("アーカイブ");
    expect(nextStage("spark")).toBe("aging");
    expect(nextStage("aging")).toBe("ripe");
    expect(nextStage("ripe")).toBe("selected");
    expect(nextStage("selected")).toBeNull();
    expect(nextStage("archived")).toBeNull();
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
        updatedAt: "2026-09-16",
        agedDays: 0,
        relatedIds: [],
        commentCount: 0,
      },
    ];
    expect(filterIdeas(sample, { query: "一時", stages: ["spark"], tags: [] })).toHaveLength(1);
    expect(filterIdeas(sample, { query: "ない", stages: [], tags: [] })).toHaveLength(0);
    expect(filterIdeas(sample, { query: "", stages: ["ripe"], tags: [] })).toHaveLength(0);
    expect(filterIdeas(sample, { query: "", stages: [], tags: [], minDays: 7 })).toHaveLength(0);
    sample[0]!.agedDays = 14;
    expect(filterIdeas(sample, { query: "", stages: [], tags: [], minDays: 7 })).toHaveLength(1);
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
    expect(
      isMobileUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
    ).toBe(true);
    expect(
      isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0"),
    ).toBe(false);
    expect(
      prefersComposeHome({
        isDesktopViewport: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
      }),
    ).toBe(true);
    expect(
      prefersComposeHome({ isDesktopViewport: false, userAgent: "Mozilla/5.0 Chrome/120" }),
    ).toBe(true);
    expect(
      homePathForClient({ isDesktopViewport: true, userAgent: "Mozilla/5.0 Chrome/120" }),
    ).toBe(LIST_PATH);
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("prefersComposeHome");
    expect(src).toContain(COMPOSE_URL_HINT);
  });

  it("keeps list + inspirations + analytics on mobile tabs and list-first workspace on desktop", () => {
    expect(MOBILE_NAV.map((item) => item.label)).toEqual(["一覧", "インスピ", "分析"]);
    expect(MOBILE_NAV.map((item) => item.to)).toEqual([
      "/app/list",
      "/app/inspirations",
      "/app/analytics",
    ]);
    const mobileDestinations: readonly string[] = MOBILE_NAV.map((item) => item.to);
    const mobileLabels: readonly string[] = MOBILE_NAV.map((item) => item.label);
    expect(mobileDestinations).not.toContain("/app");
    expect(mobileDestinations).not.toContain("/app/settings");
    expect(mobileLabels).not.toContain("新規");
    expect(mobileLabels).not.toContain("設定");
    expect(WORKSPACE_NAV.map((item) => item.label)).toEqual([
      "アイデア",
      "インスピレーション",
      "アナリティクス",
    ]);
    expect(WORKSPACE_NAV[0]?.to).toBe("/app/list");
    expect(WORKSPACE_NAV[1]?.to).toBe("/app/inspirations");
    expect(WORKSPACE_NAV[2]?.to).toBe("/app/analytics");
    expect(SETTINGS_NAV.map((item) => item.to)).toEqual(["/app/settings"]);
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
    expect(src).toContain("熟成候補");
    expect(src).toContain("試したアイデア");
    expect(src).toContain('tab === "candidates"');
    expect(src).toContain("並び順");
    expect(src).toContain("sortIdeas");
    expect(src).toContain("IdeaBoard");
    expect(src).toContain("overflow-y-auto");
    expect(src).toContain("IdeaHeaderCreateButton");
    expect(src).not.toContain("emptyWorkspace");
  });

  it("surfaces merge, research, and brainstorm as per-idea actions", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("IdeaActionsMenu");
    expect(src).toContain("IdeaResearchControls");
    expect(src).toContain("IdeaBrainstormControls");
    expect(src).toContain("/app/merge?from=");
    expect(src).toContain('id="research"');
    expect(src).toContain('id="brainstorm"');
    expect(src).toContain('name="intent"');
    expect(src).toContain('value="research"');
    expect(src).toContain('value="brainstorm"');
    expect(src).not.toContain('href="#research"');
    expect(src).toContain("速い・安い");
    expect(src).toContain("標準");
    expect(src).toContain("じっくり");
    expect(src).toContain("実行中…");
    expect(src).toContain("IdeaComments");
    expect(src).toContain("IdeaHistory");
    expect(src).toContain("buildIdeaHistory");
    expect(src).toContain("履歴");
    expect(src).toContain("概要");
    expect(src).toContain("AI/履歴");
    expect(src).toContain("ideaDetailTabFromHash");
    expect(src).toContain("削除");
    expect(src).toContain("confirmIdeaDelete");
    expect(src).toContain("PopoverMenu");
    expect(src).toContain("grid-cols-3");
    expect(src).toContain("ウェブで先行事例を数件取得し");
    expect(src).not.toContain("ウェブ検索による先行事例はまだありません");
    expect(src).not.toContain("このリサーチはモデルのみです");
    expect(src).toContain("自動タグなし");
    expect(src).toContain("自動タグは付きませんでした");
    expect(src).toContain("空なら自動タグ");
    expect(src).toContain("未実行");
    expect(src).toContain("ブレスト");
    expect(src).toContain("調査済");
    expect(src).toContain("commentCount");
    expect(src).toContain("resolveCommentAuthor");
    expect(src).toContain('intent === "comment"');
    expect(src).toContain("着想から実行できます");
    expect(src).toContain("先行事例");
    expect(src).toContain("Web検索未取得");
    expect(src).toContain("AIコメント");
    expect(src).not.toContain("ウェブ検索はありません");
    expect(src).toContain("アーカイブではリサーチできません");
    expect(src).toContain("アーカイブではブレストできません");
    expect(src).toContain("アーカイブでは実行できません");
    expect(src).not.toContain("採用で実行");
    expect(src).not.toContain("リサーチを実行（採用で実行）");
    expect(src).not.toContain("下の段階を採用に変えると");
    expect(src).not.toContain("上の段階を採用に変えると");
    expect(src).toContain("researchIdeaAction");
    expect(src).toContain("brainstormIdeaAction");
    expect(src).toContain("ideaDetailAction");
    expect(src).toContain("autoSubmit");
  });

  it("keeps fetcher pending, 44px taps, title wrap, swipe, edit, and scores", () => {
    const src = Object.values(appSources).join("\n");
    expect(src).toContain("useInstantPending");
    expect(src).toContain("min-h-11");
    expect(src).toContain('prefetch="intent"');
    const listSrc = appSources["../app/components/idea-list-view.tsx"];
    const detailSrc = appSources["../app/routes/app/idea.tsx"];
    expect(src).toContain("idea-title-wrap");
    expect(listSrc).toContain("idea-title-wrap ui-title line-clamp-3");
    expect(listSrc).toContain("idea-title-wrap ui-title line-clamp-2");
    expect(listSrc).toContain("idea-title-wrap ui-title line-clamp-3");
    expect(detailSrc).toContain("idea-title-wrap");
    expect(detailSrc).not.toMatch(/<h1[^>]*line-clamp/);
    expect(src).toContain("IdeaSwipeRow");
    expect(src).toContain("SwipeReveal");
    expect(src).toContain("IdeaDetailSwipe");
    expect(src).toContain("次の段階へ");
    expect(src).toContain("アーカイブ");
    expect(appSources["../app/components/idea-swipe-row.tsx"]).toContain("SwipeReveal");
    expect(appSources["../app/components/idea-swipe-row.tsx"]).toContain("次の段階へ");
    expect(appSources["../app/components/idea-swipe-row.tsx"]).toContain("アーカイブ");
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).toContain('"編集"');
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).toContain('label: "AI"');
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).toContain('label: "融合"');
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).toContain('"アーカイブ"');
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).not.toContain("次の段階へ");
    expect(appSources["../app/components/swipe-reveal.tsx"]).toContain("min-h-11");
    expect(appSources["../app/lib/swipe.ts"]).toContain("SWIPE_BUTTON_WIDTH = 88");
    expect(appSources["../app/lib/swipe.ts"]).toContain("DETAIL_SWIPE_BUTTON_WIDTH = 72");
    expect(src).toContain("熟成日数");
    expect(src).toContain("見直した");
    expect(src).toContain("振り返りを保存");
    expect(src).toContain("やってみた結果");
    expect(src).toContain("アナリティクス");
    expect(src).toContain("インスピレーション");
    expect(src).toContain("AIブレスト");
    expect(src).toContain("InspirationGallery");
    expect(src).toContain("inspiration-masonry");
    expect(src).toContain("inspiration-card");
    expect(src).toContain("再取得");
    expect(src).toContain("referrerPolicy");
    expect(src).toContain("refresh-ogp");
    expect(appSources["../app/routes/app/inspirations.tsx"]).not.toContain("divide-y");
    expect(src).toContain("AGED_DAY_PRESETS");
    expect(src).toContain("日以上");
    expect(src).toContain("コメント送信");
    expect(src).toContain("commentComposerResetOnSubmit");
    expect(src).toContain("commentComposerAfterSettle");
    expect(src).toContain('fetcher.state === "submitting"');
    expect(appSources["../app/components/idea-comments.tsx"]).toContain("readOnly={pending}");
    expect(appSources["../app/components/idea-comments.tsx"]).toContain("key={formKey}");
    expect(src).toContain("IdeaEditForm");
    expect(src).toContain("編集");
    expect(src).toContain("AI評価");
    expect(src).toContain("Jev 利用時は分解スコアです");
    expect(src).toContain("IdeaHumanScore");
    expect(src).toContain("IdeaScoreChips");
    expect(src).toContain("evaluateIdeaAction");
    expect(detailSrc).toContain("IdeaDetailSwipe");
    expect(detailSrc).not.toContain("IdeaAiMenu");
    expect(detailSrc).not.toContain("IconMore");
    expect(detailSrc).not.toContain("function MobileIdeaDetail");
    expect(detailSrc).toContain("compact");
    expect(appSources["../app/components/idea-detail-swipe.tsx"]).toContain('hideFrom="lg"');
    expect(appSources["../app/components/idea-swipe-row.tsx"]).not.toContain("hideFrom");
    expect(src).toContain("作成中");
    expect(src).toContain('media="print"');
    expect(appSources["../app/components/idea-list-view.tsx"]).toContain("px-4 py-2");
  });

  it("keeps named list views next to stage and tag filters", () => {
    const src = appSources["../app/components/idea-list-view.tsx"];
    expect(src).toContain("ListSavedViews");
    expect(src).toContain("useListViewSearch");
    expect(Object.values(appSources).join("\n")).toContain("ビューを保存");
    expect(Object.values(appSources).join("\n")).toContain("listViewAction");
    expect(Object.values(appSources).join("\n")).toContain('params.set("v"');
    expect(Object.values(appSources).join("\n")).toContain("熟成日数");
    expect(Object.values(appSources).join("\n")).toContain("params.set(AGED_DAYS_PARAM");
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
    expect(DESIGN_TOKENS.body).toBe("#0f1217");
    expect(DESIGN_TOKENS.muted).toBe("#3a424e");
    expect(DESIGN_TOKENS.border).toBe("#c5cad3");
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
        updatedAt: "2026-09-16",
        agedDays: 2,
        relatedIds: [],
        commentCount: 0,
      }),
    ).toBe("本文の続き");
    expect(formatRelativeJa("2026-09-18T02:00:00Z", Date.parse("2026-09-18T02:00:30Z"))).toBe(
      "たった今",
    );
  });
});
