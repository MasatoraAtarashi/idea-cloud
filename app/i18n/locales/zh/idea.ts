import type { Dictionary } from "../../dictionary";

export const idea: Dictionary["idea"] = {
  metaTitle: "创意 — 创意云",
  heading: "创意",
  empty: "还没有内容",
  listLink: "列表",
  backToList: "返回列表",
  editButton: "编辑",
  aiTab: "AI 工作台",
  agedDaysShort: (days) => `${days}d`,
  noAutoTags: "没有自动标签",

  nextStage: "进入下一阶段",
  nextStageTo: (stage) => `进入下一阶段（${stage}）`,
  nextStageArchived: "已归档，无法继续推进",
  nextStageLast: "已是最后一个阶段",
  updating: "更新中…",
  moreActions: "更多操作",
  changeStage: "更改阶段",
  mergeWithOther: "与其他创意融合",
  archive: "归档",
  untitled: "无标题",

  selfReview: {
    heading: "自评与回顾",
    open: "展开",
    score: (score) => `自评 ${score}`,
    hasReflection: "已有回顾",
  },

  merge: {
    metaTitle: "融合 — 创意云",
    heading: "融合",
    detail: "详情",
    selected: (count) => `已选 ${count} 条`,
    submit: "融合",
    hint: "选择两条以上，融合后的一句话会出现在这里。",
    result: (titles) => `把 ${titles} 合成一条。`,
  },

  edit: {
    title: "标题",
    body: "正文",
    tags: "标签",
    tagsPlaceholder: "用逗号或顿号分隔",
    category: "分类",
    stage: "阶段",
    saving: "保存中…",
  },

  comments: {
    heading: "评论",
    empty: "还没有评论。之后可以慢慢补充。",
    placeholder: "写下后来想到的事",
    sendLabel: "发送评论",
    addAs: (name) => `以 ${name} 添加（⌘Enter）`,
    send: "发送",
    sending: "发送中…",
  },

  actions: {
    menuLabel: "操作",
    delete: "删除",
    deleting: "删除中…",
  },

  copy: {
    label: "复制",
    aria: "连同说明一起复制",
    result: "复制结果",
    ok: "已复制",
    fail: "复制失败",
    stageField: "阶段",
    categoryField: "分类",
    tagsField: "标签",
  },

  swipe: {
    ai: "AI",
    merge: "融合",
  },

  score: {
    heading: "评分",
    hint: "1–5 分。可以顺手留一句短备注。",
    noteLabel: "评分备注",
    notePlaceholder: "简短备注（可选）",
    human: (score) => `人${score}`,
    ai: (score) => `AI${score}`,
  },

  review: {
    heading: "回看",
    hint: "沉淀之后，决定继续推进还是先停下。",
    current: (status) => ` 目前是${status}。`,
    reviewed: "已回看",
    hold: "暂缓",
    discard: "舍弃",
    discardPrompt: "可以归档下架，也可以彻底删除。",
    rested: (days) => `已沉淀 ${days} 天。现在重读感觉如何？`,
    archive: "归档",
    delete: "删除",
    cancel: "算了",
  },

  reflection: {
    heading: "回顾",
    hint: "只记录尝试之后的结果。暂时不会交给 AI。",
    outcomeLabel: "尝试后的结果",
    outcomePlaceholder: "尝试后的结果",
    notesLabel: "回顾备注",
    notesPlaceholder: "备注（可选）",
    submit: "保存回顾",
    saving: "保存中…",
    status: {
      none: "未填写",
      tried: "试过了",
      hold: "暂缓",
      dropped: "放弃",
    },
  },

  tabs: {
    discuss: "商量",
    evaluate: "评价",
    research: "调研",
    brainstorm: "头脑风暴",
  },

  evaluation: {
    scoreLabel: "看好度",
    meaning: {
      1: "为时尚早",
      2: "需要谨慎",
      3: "说不上好坏",
      4: "可以推进",
      5: "非常看好",
    },
    section: {
      strengths: "优点",
      risks: "风险",
      novelty: "新意",
      nextMove: "下一步",
    },
  },

  deleteConfirm: (title) => `将删除「${title}」。此操作无法撤销。`,

  errors: {
    required: "请输入内容",
    tooLong: "太长了",
    notFound: "找不到",
    invalidStage: "阶段不正确",
    invalidReviewStatus: "回看状态不正确",
    outcomeTooLong: "结果太长了",
    noteTooLong: "备注太长了",
    scoreRange: "请选择 1 到 5",
  },
};
