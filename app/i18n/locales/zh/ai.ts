import type { Dictionary } from "../../dictionary";

export const ai: Dictionary["ai"] = {
  workbench: {
    title: "AI 工作台",
    presetLabel: "预设",
    running: "执行中",
  },

  preset: {
    fast: "快速省钱",
    standard: "标准",
    deep: "深入",
  },

  archive: {
    research: "归档后无法调研",
    brainstorm: "归档后无法头脑风暴",
    evaluate: "归档后无法 AI 评分",
    discuss: "归档后无法咨询",
  },

  /** Bad or unknown idea id in an AI action. */
  notFound: "未找到",

  menu: {
    actions: "操作",
  },

  research: {
    run: "开始调研",
    rerun: "再调研一次",
    running: "执行中…",
    hint: "从网上取几条同类案例，结合正文一起分析。",
    sourcesHeading: "同类案例",
    webSearchUnavailable: "未获取到网页结果",
    latest: "最新调研",
    comment: "AI 评述",
    notRun: "还没有执行。",
    emptyArchived: "还没有调研记录。归档后无法调研",
  },

  brainstorm: {
    run: "头脑风暴",
    running: "执行中…",
    hint: "拓展切入点、备选方案和下一个问题。每次都会保留。",
    latest: "最新",
    previous: "较早",
    notRun: "还没有执行。",
    emptyArchived: "还没有内容。归档后无法头脑风暴",
  },

  evaluate: {
    run: "AI 评分",
    rerun: "再评一次",
    running: "评分中…",
    hint: (scoreLabel: string) =>
      `优势、风险、新颖度、下一步，以及 1–5 的${scoreLabel}。只保留最新一次。`,
    notScored: "还没有评分",
    inProgress: "evaluating…",
    fullTitle: "评分全文",
    noBody: "没有正文。",
    notRun: "还没有评分。",
    emptyArchived: "还没有评分。归档后无法 AI 评分",
  },

  discuss: {
    link: "和 AI 聊聊",
    intro: "可以就这个想法提问。不做法律判断。可以从下面的问题开始。",
    saved: "咨询会被保存",
    inputLabel: "向 AI 提问",
    placeholder: "问问这个想法",
    send: "发送",
    sending: "发送中…",
    starters: [
      { label: "做成落地页", body: "这个如果做成落地页，大概是什么样子？" },
      { label: "有法律风险吗？", body: "这个有法律风险吗？" },
      { label: "下一步是？", body: "下一步该做什么？" },
      { label: "和对手的差异", body: "和竞品相比，差异化在哪里？" },
    ],
  },

  premium: {
    title: "高级版专属",
    body: "AI 工作台（咨询、评分、调研、头脑风暴）和自动标签属于高级版功能。",
    cta: "升级高级版",
    opening: "正在打开…",
    note: "支付在 Stripe 页面完成。创建、编辑和评论想法始终免费。",
  },

  billing: {
    notReady: "付费功能还在准备中。",
    failed: "无法打开支付页面。请稍后再试。",
  },

  page: {
    metaTitle: "调研 — 创意云",
    title: "调研",
    empty: "还没有内容",
    selectLabel: "已采用的想法",
    openDetail: "打开详情",
    tabResearch: "调研",
    tabProto: "原型",
    noNotes: "还没有调研记录。",
    protoNote: "小实验的步骤，等采用之后再写。",
  },
};
