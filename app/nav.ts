import type { Dictionary } from "./i18n/dictionary";

/** Key into `t.nav.items`. The copy lives in the per-locale `nav` dictionaries. */
export type NavLabelKey = keyof Dictionary["nav"]["items"];

export const WORKSPACE_NAV = [
  { to: "/app/list", labelKey: "ideas", end: true, icon: "list" },
  { to: "/app/inspirations", labelKey: "inspirations", end: false, icon: "pin" },
  { to: "/app/analytics", labelKey: "analytics", end: false, icon: "chart" },
] as const satisfies readonly { to: string; labelKey: NavLabelKey; end: boolean; icon: string }[];

export const SETTINGS_NAV = [
  { to: "/app/settings", labelKey: "settings", icon: "settings" },
] as const satisfies readonly { to: string; labelKey: NavLabelKey; icon: string }[];

/**
 * Mobile day-to-day destinations. Compose is a header + (cold-start still `/app`).
 * Settings stays out of the tab bar (header gear).
 */
export const MOBILE_NAV = [
  {
    to: "/app/list",
    labelKey: "ideasShort",
    end: true,
    icon: "list",
    ariaLabelKey: "ideasShort",
  },
  {
    to: "/app/inspirations",
    labelKey: "inspirationsShort",
    end: false,
    icon: "pin",
    ariaLabelKey: "inspirations",
  },
  {
    to: "/app/analytics",
    labelKey: "analyticsShort",
    end: false,
    icon: "chart",
    ariaLabelKey: "analytics",
  },
] as const satisfies readonly {
  to: string;
  labelKey: NavLabelKey;
  end: boolean;
  icon: string;
  ariaLabelKey: NavLabelKey;
}[];

export type WorkspaceNavItem = (typeof WORKSPACE_NAV)[number];
export type SettingsNavItem = (typeof SETTINGS_NAV)[number];
export type MobileNavItem = (typeof MOBILE_NAV)[number];

export function normalizeAppPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

/** Stack screens: hide the tab bar so detail / compose chrome can breathe. */
export function isMobileTabBarHidden(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  if (path === "/app" || path === "/app/capture") return true;
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
