import type { Dictionary } from "../../dictionary";

export const lp: Dictionary["lp"] = {
  metaTitle: "创意云 — 让想法沉淀成熟的置物架",
  metaDescription:
    "想到的瞬间就记下，刻意忘掉，成熟后再回看。把《思考的整理学》的酝酿法直接做成的团队工作空间。",
  skipToContent: "跳到正文",

  hero: {
    eyebrow: "把酝酿法，直接做成工具",
    title: "好想法，\n是放一放之后才看得见的。",
    body: "想到就当场记下，之后刻意不去碰它。只有在它成熟时才会再出现，那时再决定：推进、合并，还是丢掉。",
    note: "无需信用卡，用 Google 账号即可开始。",
  },

  ritual: {
    title: "只有三个动作",
    body: "这不是写字的地方，而是时间的置物架。这里增加的是沉淀的时间，不是功能。",
    steps: [
      {
        step: "01",
        title: "记下",
        body: "打开手机就是输入框。标签留空也没关系，AI 之后会补上。",
      },
      {
        step: "02",
        title: "沉淀",
        body: "灵感直接进入酝酿中。想立刻打磨的冲动，由产品替你拦下。",
      },
      {
        step: "03",
        title: "回看",
        body: "成熟的想法会自己浮上来。推进、融合、丢弃，一次决定。",
      },
    ],
  },

  features: {
    title: "沉淀之后，不让你一个人面对",
    body: "只有在回看时，AI 才会同席；你在书写时它不插话。",
    items: [
      {
        title: "AI 评估",
        body: "从新颖性、影响力、可行性出发，一屏给出推荐度和下一步动作。",
      },
      {
        title: "调研",
        body: "上网查找先例。找不到时会如实说明，而不是编造出处。",
      },
      {
        title: "头脑风暴",
        body: "展开切入点、替代方案和下一个问题，为卡住的想法留出口。",
      },
      {
        title: "咨询",
        body: "只以这一条想法为上下文的对话，不必重新解释整体背景。",
      },
      {
        title: "灵感收集",
        body: "把在意的文章或图片贴进来，就会作为想法的种子排列在一起。",
      },
      {
        title: "数据分析",
        body: "记下了多少，又有多少真正成熟。看的是积累，而不是努力。",
      },
    ],
  },

  stages: {
    title: "五个阶段",
    body: "不是进度，而是时间的状态。",
    items: [
      { label: "灵感", body: "刚记下，先别打磨。" },
      { label: "酝酿中", body: "让它休息，忘掉也没关系。" },
      { label: "成熟", body: "该回看的信号。" },
      { label: "采用", body: "决定要推进的。" },
      { label: "归档", body: "作为记录保留。" },
    ],
  },

  team: {
    title: "一个人用，也能一起用",
    body: "既是你个人的置物架，也能原样共享给团队。评论会像 Zenn scrap 一样按时间顺序累积。",
  },

  cta: {
    title: "把今天的灵感，\n交给半年后的自己。",
    body: "用 Google 账号登录，马上就能放上第一条。",
  },

  footer: {
    tagline: "让想法沉淀成熟的工作空间",
    copyright: (year: number) => `© ${year} Idea Cloud`,
  },
};
