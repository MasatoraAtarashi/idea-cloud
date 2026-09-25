import type { Dictionary } from "../../dictionary";

export const settings: Dictionary["settings"] = {
  metaTitle: "设置 — 创意云",
  title: "设置",

  groups: {
    workspace: "工作区",
    personal: "个人",
  },
  sections: {
    members: "成员与权限",
    general: "通用",
    team: "团队",
    stages: "阶段与标签",
    profile: "个人资料",
    notify: "通知与沉淀提醒",
    shortcuts: "快捷键",
  },
  stub: "暂时还没有内容。",

  language: {
    title: "语言",
    description: "切换界面显示的语言。",
  },

  members: {
    description: "想法的查看和编辑范围按团队划分。",
    invite: "邀请成员",
    inviteDisabled: "尚未接通",
    columns: {
      member: "成员",
      role: "权限",
      lastSeen: "最近访问",
    },
    roles: {
      owner: "管理员",
      member: "成员",
    },
    online: "已登录",
    visibility: {
      heading: "默认可见范围",
      team: { title: "整个团队", body: "同团队的所有人都能查看和编辑" },
      author: { title: "仅提出者", body: "分享之前只有本人能看到" },
      workspace: { title: "整个工作区", body: "所有团队都能跨团队查看" },
      note: "仅作展示，暂不保存。",
    },
  },

  profile: {
    account: "已登录的 Google 账号",
    unknown: "未知",
    note: "名称和头像跟随 Google 设置。付款在 Stripe 页面完成。",
  },

  billing: {
    plan: "套餐",
    premium: "高级版（含 AI 功能）",
    free: "免费版（无 AI 功能）",
    comped: "由管理员授予，无需付费。",
    canceledPrefix: "可用至",
    renewsPrefix: "下次续费",
    pastDueSuffix: "（正在重试扣款）",
    upgrade: "升级高级版",
    manage: "支付方式与退订",
  },

  dateLocale: "zh-CN",
};
