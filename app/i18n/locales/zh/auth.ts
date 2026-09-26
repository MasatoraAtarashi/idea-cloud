import type { Dictionary } from "../../dictionary";

export const auth: Dictionary["auth"] = {
  cta: "使用 Google 继续",
  tagline: "先记下想法，让它沉淀，成熟后再回看。",
  note: "仅限组织账号使用",
  metaTitle: "登录 — 创意云",
  errors: {
    fallback: "无法登录，请重试。",
    not_allowed: "该账号不在允许列表中，请联系管理员。",
    google_denied: "已在 Google 一侧取消登录。",
    invalid_request: "登录过程中信息丢失，请重试。",
    invalid_identity: "无法确认邮箱地址，请换一个账号试试。",
    exchange_failed: "与 Google 的通信失败，请稍后再试。",
    oauth_unconfigured: "服务器端的 Google 设置尚未完成。",
    server_misconfigured: "服务器端的设置尚未完成。",
  },
};
