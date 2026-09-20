export const WORKSPACE_NAV = [
  { to: "/app/list", label: "アイデア", end: true, icon: "list" },
  { to: "/app/inspirations", label: "インスピレーション", end: false, icon: "pin" },
  { to: "/app/analytics", label: "アナリティクス", end: false, icon: "chart" },
] as const;

export const SETTINGS_NAV = [{ to: "/app/settings", label: "設定", icon: "settings" }] as const;

/**
 * Mobile primary destinations. Short labels fit a 4-tab bar;
 * `ariaLabel` keeps the full destination name for assistive tech.
 * Settings stays out of the tab bar (header gear).
 */
export const MOBILE_NAV = [
  {
    to: "/app/list",
    label: "一覧",
    end: true,
    icon: "list",
    primary: false,
    ariaLabel: "一覧",
  },
  {
    to: "/app/inspirations",
    label: "インスピ",
    end: false,
    icon: "pin",
    primary: false,
    ariaLabel: "インスピレーション",
  },
  {
    to: "/app",
    label: "新規",
    end: true,
    icon: "plus",
    primary: true,
    ariaLabel: "新規アイデア",
  },
  {
    to: "/app/analytics",
    label: "分析",
    end: false,
    icon: "chart",
    primary: false,
    ariaLabel: "アナリティクス",
  },
] as const;

export type WorkspaceNavItem = (typeof WORKSPACE_NAV)[number];
export type SettingsNavItem = (typeof SETTINGS_NAV)[number];
export type MobileNavItem = (typeof MOBILE_NAV)[number];

export function normalizeAppPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

/** Stack screens: hide the tab bar so detail chrome can breathe. */
export function isMobileTabBarHidden(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  if (path === "/app/settings" || path.startsWith("/app/settings/")) return true;
  if (path === "/app/team") return true;
  if (path.startsWith("/app/ideas/")) return true;
  if (/^\/app\/inspirations\/[^/]+$/.test(path)) return true;
  if (path === "/app/merge" || path.startsWith("/app/merge/")) return true;
  if (path === "/app/research" || path.startsWith("/app/research/")) return true;
  return false;
}

export function isComposeNavPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/app" || path === "/app/capture";
}

export function isListNavPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return (
    path === "/app/list" ||
    path.startsWith("/app/ideas/") ||
    path === "/app/merge" ||
    path.startsWith("/app/merge/") ||
    path === "/app/research" ||
    path.startsWith("/app/research/")
  );
}

export function isInspirationNavPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/app/inspirations" || path.startsWith("/app/inspirations/");
}

export function isAnalyticsNavPath(pathname: string): boolean {
  return normalizeAppPath(pathname) === "/app/analytics";
}

export function isSettingsNavPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/app/settings" || path.startsWith("/app/settings/") || path === "/app/team";
}

export function isMobileNavActive(item: MobileNavItem, pathname: string): boolean {
  if (item.primary) return isComposeNavPath(pathname);
  if (item.to === "/app/list") return normalizeAppPath(pathname) === "/app/list";
  if (item.to === "/app/inspirations") return isInspirationNavPath(pathname);
  if (item.to === "/app/analytics") return isAnalyticsNavPath(pathname);
  return false;
}

export function isWorkspaceNavActive(
  item: WorkspaceNavItem | SettingsNavItem,
  pathname: string,
): boolean {
  if (item.to === "/app/list") return isListNavPath(pathname);
  if (item.to === "/app/inspirations") return isInspirationNavPath(pathname);
  if (item.to === "/app/analytics") return isAnalyticsNavPath(pathname);
  if (item.to === "/app/settings") return isSettingsNavPath(pathname);
  return false;
}
