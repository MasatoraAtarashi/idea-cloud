export const WORKSPACE_NAV = [
  { to: "/app/list", label: "アイデア", end: true, icon: "list" },
  { to: "/app/capture", label: "キャプチャ", icon: "plus" },
  { to: "/app/merge", label: "融合", icon: "merge" },
  { to: "/app/research", label: "リサーチ", icon: "search" },
] as const;

export const ACCESS_NAV = [{ to: "/app/team", label: "チーム", icon: "users" }] as const;

/** Mobile bottom nav. Capture is first — `/app` is the compose home. */
export const MOBILE_NAV = [
  { to: "/app", label: "取る", end: true, icon: "plus", primary: true },
  { to: "/app/list", label: "一覧", end: true, icon: "list", primary: false },
  { to: "/app/merge", label: "融合", end: false, icon: "merge", primary: false },
  { to: "/app/research", label: "研究", end: false, icon: "search", primary: false },
  { to: "/app/team", label: "設定", end: false, icon: "users", primary: false },
] as const;
