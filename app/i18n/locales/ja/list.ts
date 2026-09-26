import type { Stage } from "../../../data/mock";
import type { ListSortKey } from "../../../lib/list-sort";
import type { ListTab } from "../../../lib/list-view-search";
import type { ReviewStatus } from "../../../lib/review";

export const list = {
  metaTitle: "アイデア — アイデアクラウド",
  title: "アイデア",
  count: (n: number) => `${n} 件`,

  layout: {
    table: "リスト",
    board: "ボード",
  },

  tabsLabel: "アイデアの絞り込みタブ",
  tab: {
    all: "すべて",
    "aging-shelf": "熟成中",
    candidates: "見直し候補",
    tried: "試した",
  } satisfies Record<ListTab, string>,
  /** Narrower labels for the mobile tab strip. */
  tabShort: {
    all: "すべて",
    "aging-shelf": "熟成中",
    candidates: "見直し",
    tried: "試した",
  } satisfies Record<ListTab, string>,

  clearFilters: "条件をクリア",
  filters: "絞り込み",
  search: "検索",
  sortOrder: "並び順",

  candidateBanner: (n: number) => `見直し時期が ${n} 件`,
  candidateBannerAction: "見る",

  column: {
    stage: "段階",
    idea: "アイデア",
    tags: "タグ",
    aiScore: "推し度",
    comments: "コメント",
    aged: "熟成",
    updated: "更新",
  },
  aiScoreFull: "AI 推し度",
  sortByLabel: (label: string) => `${label}で並べ替え`,
  filterByLabel: (label: string) => `${label}で絞り込み`,

  keyword: "キーワード",
  keywordPlaceholderShort: "タイトル・本文・タグ",
  keywordPlaceholder: "タイトル・本文・タグで絞り込む",
  category: "カテゴリ",
  allOption: "すべて",
  noTags: "まだタグがありません",
  agedDays: "熟成日数",
  agedDaysAtLeast: (n: number) => `${n}日以上`,
  agedDaysMin: "最小の熟成日数",
  agedDaysMinPlaceholder: "日以上",

  groupHint: {
    aging: "寝かせている。触らなくていい。",
    ripe: "読み返す頃合い。進めるか決める。",
    spark: "捕まえたばかり。磨かない。",
    selected: "動かすと決めたもの。",
    archived: "いまは動かさない。",
  } satisfies Record<Stage, string>,

  sort: {
    key: {
      updatedAt: "更新",
      createdAt: "作成",
      stage: "段階",
      title: "タイトル",
    } satisfies Record<ListSortKey, string>,
    asc: "昇順",
    desc: "降順",
  },

  boardEmpty: "まだありません",

  swipe: {
    next: "次の段階へ",
    archive: "アーカイブ",
    updating: "更新中…",
  },

  meta: {
    aiScore: (score: number) => `推し度 ${score}`,
    comments: (n: number) => `コメント ${n}`,
  },

  savedViews: {
    label: "ビュー",
    fallbackName: "ビュー",
    custom: "カスタム",
    allIdeas: "すべてのアイデア",
    empty: "まだビューはありません",
    delete: "削除",
    deleteLabel: (name: string) => `${name}を削除`,
    nameLabel: "ビュー名",
    namePlaceholder: "現在の絞り込みを保存",
    save: "ビューを保存",
    hint: "段階・タグ・熟成日数・検索を名前付きで残せます",
    errorNameRequired: "名前を入力してください",
    errorNameTooLong: "名前が長すぎます",
    errorTooMany: "ビューが多すぎます",
    errorNotFound: "見つかりません",
    errorBadIntent: "操作が不正です",
  },

  empty: {
    title: "まだアイデアがありません",
    body: "思いついた時点の粗さを残します。預けて寝かせ、熟した頃に見返します。",
    create: "最初のアイデアを作成",
  },

  reviewStatus: {
    none: "未見直し",
    hold: "保留",
    reviewed: "見直した",
  } satisfies Record<ReviewStatus, string>,

  /** Absolute date in row meta and tooltips. */
  date: (y: string, m: string, d: string) => `${y}/${m}/${d}`,

  /** Aged-days badge: `12日`. */
  days: (n: number) => `${n}日`,

  /** Prose relative time, used in comment and activity lines. */
  relative: {
    now: "たった今",
    minutesAgo: (n: number) => `${n}分前`,
    hoursAgo: (n: number) => `${n}時間前`,
    yesterday: "昨日",
    daysAgo: (n: number) => `${n}日前`,
    lastWeek: "先週",
    weeksAgo: (n: number) => `${n}週間前`,
  },

  /** Mono row meta. Abbreviations stay latin in every locale: the column is 48px wide. */
  compact: {
    now: "now",
    minutes: (n: number) => `${n}m`,
    hours: (n: number) => `${n}h`,
    days: (n: number) => `${n}d`,
    weeks: (n: number) => `${n}w`,
  },

  /** Quick peek drawer opened from a row. */
  peek: {
    heading: "クイックビュー",
    prev: "前のアイデア",
    next: "次のアイデア",
    position: (index: number, total: number) => `${index} / ${total}`,
    keyHint: "↑↓ で送る",
    openDetail: "詳細を開く",
    detailHint: "リサーチ・ブレスト・相談は詳細画面で。",
    noBody: "本文なし",
  },
};
