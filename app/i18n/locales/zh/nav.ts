import type { Dictionary } from "../../dictionary";

export const nav: Dictionary["nav"] = {
  workspace: "工作区",
  main: "主导航",

  items: {
    ideas: "想法",
    inspirations: "灵感",
    analytics: "分析",
    settings: "设置",
    ideasShort: "列表",
    inspirationsShort: "灵感",
    analyticsShort: "分析",
  },

  savedViews: "已保存视图",
  viewName: "视图名称",
  saveCurrentFilters: "保存当前条件",

  reviewDueSuffix: "条待回顾",
  reviewDueBody: (days: number) => `已搁置 ${days} 天以上。是推进，还是放下，该定了。`,
  reviewDueAction: "去回顾",

  search: {
    trigger: "搜索想法",
    label: "搜索",
    placeholder: "搜索想法、评论、灵感、标签",
    hint: "跨标题、正文、评论、灵感和标签一起查找。",
    loading: "搜索中…",
    empty: (query: string) => `没有找到“${query}”`,
    moveHint: "↑↓ 移动",
    openHint: "⏎ 打开",
    create: "新建想法",
    createWith: (query: string) => `以“${query}”新建想法`,
    tagCount: (count: number) => `${count} 条`,
    kinds: {
      all: "全部",
      idea: "想法",
      comment: "评论",
      inspiration: "灵感",
      tag: "标签",
    },
  },
};
