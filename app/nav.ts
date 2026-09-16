export const WORKSPACE_NAV = [
  { to: "/app", label: "アイデア", end: true, icon: "list" },
  { to: "/app/capture", label: "キャプチャ", icon: "plus" },
  { to: "/app/merge", label: "融合", icon: "merge" },
  { to: "/app/research", label: "リサーチ", icon: "search" },
] as const;

export const ACCESS_NAV = [{ to: "/app/team", label: "チーム", icon: "users" }] as const;

/** Mobile bottom nav. Capture first — not a second landing page. */
export const MOBILE_NAV = [
  { to: "/app/capture", label: "取る", end: false },
  { to: "/app", label: "一覧", end: true },
  { to: "/app/merge", label: "融合", end: false },
  { to: "/app/research", label: "研究", end: false },
  { to: "/app/team", label: "設定", end: false },
] as const;
