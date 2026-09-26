export const nav = {
  /** Sidebar landmark. */
  workspace: "ワークスペース",
  /** Mobile tab bar landmark. */
  main: "メイン",

  /** Destination labels. `labelKey` / `ariaLabelKey` in app/nav.ts point in here. */
  items: {
    ideas: "アイデア",
    inspirations: "インスピレーション",
    analytics: "アナリティクス",
    settings: "設定",
    /** Short forms for the three-up mobile tab bar. */
    ideasShort: "一覧",
    inspirationsShort: "インスピ",
    analyticsShort: "分析",
  },

  savedViews: "保存したビュー",
  viewName: "ビュー名",
  saveCurrentFilters: "現在の条件を保存",

  /** Sits after the count, which is rendered in its own span. */
  reviewDueSuffix: "件が見直し時期",
  reviewDueBody: (days: number) => `${days}日以上そのまま。進めるか、捨てるか決める頃合いです。`,
  reviewDueAction: "見直す",

  search: {
    trigger: "アイデアを検索",
    label: "検索",
    placeholder: "アイデア・コメント・インスピ・タグを検索",
    hint: "タイトル・本文・コメント・インスピレーション・タグを横断して探します。",
    loading: "検索中…",
    empty: (query: string) => `「${query}」は見つかりませんでした`,
    moveHint: "↑↓ 移動",
    openHint: "⏎ 開く",
    create: "新規アイデア",
    createWith: (query: string) => `「${query}」で新規アイデア`,
    tagCount: (count: number) => `${count}件`,
    kinds: {
      all: "すべて",
      idea: "アイデア",
      comment: "コメント",
      inspiration: "インスピ",
      tag: "タグ",
    },
  },
};
