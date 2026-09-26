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
    api: "API 密钥（MCP）",
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

  workspace: {
    label: "工作区",
    members: {
      description: "此工作区的所有成员都可以查看和编辑其中的想法与灵感。",
      createInvite: "创建邀请链接",
      inviteLabel: "邀请链接（{days} 天内有效，任何用 Google 登录的人都可加入）",
      joined: "加入",
      self: "（自己）",
      remove: "移除",
      activeInvites: "有效的邀请链接",
      inviteRow: "以{role}加入 · 已使用 {uses}/{max} 次 · 有效期至 {until}",
      revoke: "停用",
      inviteNote: "链接本身不会保存，无法再次显示。需要时请重新创建。",
      leaveTitle: "退出此工作区",
      leaveBody: "退出后将切换到其他工作区。最后一位管理员无法退出。",
      leave: "退出",
      leaveConfirm: "确定退出此工作区？",
    },
    general: {
      name: "工作区名称",
      ownerOnly: "只有管理员可以重命名。",
      saved: "已保存。",
      mine: "已加入的工作区",
      current: "当前",
      switch: "切换",
      createTitle: "创建新工作区",
      createPlaceholder: "团队或项目名称",
      create: "创建",
    },
    api: {
      title: "API 密钥（MCP）",
      description:
        "Cursor、Claude Desktop 等代理连接 /mcp 时使用的 Authorization: Bearer。密钥只能读写此工作区的数据。",
      ownerOnly: "只有管理员可以签发和管理密钥。",
      namePlaceholder: "用途（例如 Cursor）",
      nameLabel: "密钥名称",
      issue: "签发",
      createdLabel: "新密钥。仅此一次显示，关闭后无法再查看。",
      none: "还没有密钥。",
      lastUsed: "最后使用 {date}",
      unused: "未使用",
    },
    copy: "复制",
    copied: "已复制",
    join: {
      metaTitle: "加入工作区 — Idea Cloud",
      eyebrow: "工作区邀请",
      cannot: "无法加入",
      alreadyMember: "你已是此工作区的成员。正在切换。",
      willJoin: "加入后即可查看和编辑此工作区的想法与灵感。",
      open: "打开",
      join: "加入",
      status: {
        missing: "找不到此邀请链接。",
        expired: "此邀请链接已过期。",
        revoked: "此邀请链接已停用。",
        exhausted: "此邀请链接已达到使用次数上限。",
      },
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
