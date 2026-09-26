import type { Dictionary } from "../../dictionary";

export const compose: Dictionary["compose"] = {
  title: "新建想法",
  metaTitle: "新建想法 — 创意云",
  shortcutHint: "新建想法 (⌘N)",

  heading: "新的想法",
  subheading: "不用整理，之后慢慢沉淀。",
  titlePlaceholder: "标题",
  placeholder: "想到什么，先写一句。",

  submit: "创建",
  submitWide: "创建想法",
  submitting: "创建中…",
  draftHint: "⌘Enter 创建",

  tags: "标签",
  tagsPlaceholder: "标签（留空则自动生成）",
  tagHint: "留空则自动",
  autoTagNote: "自动标签失败也不会丢掉这条想法。正文里的链接也会存进灵感。",
  urlHint: "正文里的链接也会存进灵感",

  category: {
    label: "分类",
    optional: "分类（可选）",
    namePlaceholder: "分类名称",
    add: "＋ 新建分类",
    cancel: "取消",
    none: "无",
    newOption: "新建分类…",
  },
};
