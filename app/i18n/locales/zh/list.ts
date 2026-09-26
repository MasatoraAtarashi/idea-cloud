import type { Dictionary } from "../../dictionary";

export const list: Dictionary["list"] = {
  metaTitle: "想法 — 想法云",
  title: "想法",
  count: (n: number) => `${n} 条`,

  layout: {
    table: "列表",
    board: "看板",
  },

  tabsLabel: "想法筛选标签",
  tab: {
    all: "全部",
    "aging-shelf": "沉淀中",
    candidates: "待回顾",
    tried: "已尝试",
  },
  tabShort: {
    all: "全部",
    "aging-shelf": "沉淀中",
    candidates: "回顾",
    tried: "已试",
  },

  clearFilters: "清除筛选",
  filters: "筛选",
  search: "搜索",
  sortOrder: "排序",

  candidateBanner: (n: number) => `有 ${n} 条该回顾了`,
  candidateBannerAction: "查看",

  column: {
    stage: "阶段",
    idea: "想法",
    tags: "标签",
    aiScore: "推荐度",
    comments: "评论",
    aged: "沉淀",
    updated: "更新",
  },
  aiScoreFull: "AI 推荐度",
  sortByLabel: (label: string) => `按${label}排序`,
  filterByLabel: (label: string) => `按${label}筛选`,

  keyword: "关键词",
  keywordPlaceholderShort: "标题、正文、标签",
  keywordPlaceholder: "按标题、正文或标签筛选",
  category: "分类",
  allOption: "全部",
  noTags: "还没有标签",
  agedDays: "沉淀天数",
  agedDaysAtLeast: (n: number) => `${n}天以上`,
  agedDaysMin: "最少沉淀天数",
  agedDaysMinPlaceholder: "天以上",

  groupHint: {
    aging: "正在沉淀，先别动它。",
    ripe: "该重读了，决定是否推进。",
    spark: "刚记下来，不要打磨。",
    selected: "已决定要做的。",
    archived: "暂时不动。",
  },

  sort: {
    key: {
      updatedAt: "更新",
      createdAt: "创建",
      stage: "阶段",
      title: "标题",
    },
    asc: "升序",
    desc: "降序",
  },

  boardEmpty: "还没有内容",

  swipe: {
    next: "进入下一阶段",
    archive: "归档",
    updating: "更新中…",
  },

  meta: {
    aiScore: (score: number) => `推荐度 ${score}`,
    comments: (n: number) => `评论 ${n}`,
  },

  savedViews: {
    label: "视图",
    fallbackName: "视图",
    custom: "自定义",
    allIdeas: "全部想法",
    empty: "还没有保存的视图",
    delete: "删除",
    deleteLabel: (name: string) => `删除${name}`,
    nameLabel: "视图名称",
    namePlaceholder: "保存当前筛选",
    save: "保存视图",
    hint: "可为阶段、标签、沉淀天数和搜索取名保存。",
    errorNameRequired: "请输入名称",
    errorNameTooLong: "名称太长了",
    errorTooMany: "视图太多了",
    errorNotFound: "未找到",
    errorBadIntent: "操作无效",
  },

  empty: {
    title: "还没有想法",
    body: "保留想到那一刻的粗糙。先存起来沉淀，等熟了再回头看。",
    create: "创建第一条想法",
  },

  reviewStatus: {
    none: "未回顾",
    hold: "搁置",
    reviewed: "已回顾",
  },

  date: (y: string, m: string, d: string) => `${y}/${m}/${d}`,

  days: (n: number) => `${n}天`,

  relative: {
    now: "刚刚",
    minutesAgo: (n: number) => `${n}分钟前`,
    hoursAgo: (n: number) => `${n}小时前`,
    yesterday: "昨天",
    daysAgo: (n: number) => `${n}天前`,
    lastWeek: "上周",
    weeksAgo: (n: number) => `${n}周前`,
  },

  compact: {
    now: "now",
    minutes: (n: number) => `${n}m`,
    hours: (n: number) => `${n}h`,
    days: (n: number) => `${n}d`,
    weeks: (n: number) => `${n}w`,
  },

  /** Quick peek drawer opened from a row. */
  peek: {
    heading: "快速查看",
    prev: "上一个想法",
    next: "下一个想法",
    position: (index: number, total: number) => `${index} / ${total}`,
    keyHint: "↑↓ 切换",
    openDetail: "打开详情",
    detailHint: "调研、脑暴和讨论请到详情页。",
    noBody: "无正文",
  },
};
