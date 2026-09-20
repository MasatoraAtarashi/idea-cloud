export const WORKSPACE_NAV = [
  { to: "/app/list", label: "アイデア", end: true, icon: "list" },
  { to: "/app/inspirations", label: "インスピレーション", end: false, icon: "pin" },
] as const;

export const SETTINGS_NAV = [
  { to: "/app/analytics", label: "アナリティクス", icon: "clock" },
  { to: "/app/settings", label: "設定", icon: "settings" },
] as const;

/** Mobile bottom nav: list + new idea + settings. Compose home stays `/app`. */
export const MOBILE_NAV = [
  { to: "/app/list", label: "一覧", end: true, icon: "list", primary: false },
  { to: "/app", label: "新規", end: true, icon: "plus", primary: true },
  { to: "/app/settings", label: "設定", end: false, icon: "settings", primary: false },
] as const;
