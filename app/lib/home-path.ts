/** Tailwind `md` — desktop list vs mobile compose. */
export const MD_QUERY = "(min-width: 768px)";

/** `/app` is new-idea compose (mobile home). Desktop `/app` replaces to the list. */
export const NEW_IDEA_PATH = "/app";
export const NEW_IDEA_ALIAS = "/app/capture";
export const LIST_PATH = "/app/list";
export const SETTINGS_PATH = "/app/settings";
export const ANALYTICS_PATH = "/app/analytics";
export const INSPIRATIONS_PATH = "/app/inspirations";

/** Phone / tablet UA — スマホ=登録トップ (compose-first), even if the viewport is wide. */
const MOBILE_UA_RE =
  /Android.+Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone/i;

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (MOBILE_UA_RE.test(userAgent)) return true;
  // iPadOS 13+ often sends a desktop Safari UA that still includes Mobile.
  return /Macintosh/i.test(userAgent) && /Mobile/i.test(userAgent);
}

export function homePath(isDesktop: boolean): typeof LIST_PATH | typeof NEW_IDEA_PATH {
  return isDesktop ? LIST_PATH : NEW_IDEA_PATH;
}

/** Compose-first when the viewport is below `md` or the UA looks like a phone. */
export function prefersComposeHome(input: {
  isDesktopViewport: boolean;
  userAgent?: string | null;
}): boolean {
  if (isMobileUserAgent(input.userAgent)) return true;
  return !input.isDesktopViewport;
}

export function homePathForClient(input: {
  isDesktopViewport: boolean;
  userAgent?: string | null;
}): typeof LIST_PATH | typeof NEW_IDEA_PATH {
  return prefersComposeHome(input) ? NEW_IDEA_PATH : LIST_PATH;
}

export function isComposePath(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/" || pathname === "/app/capture";
}

export function isDesktopViewport(
  matchMedia: (query: string) => { matches: boolean } = (query) => window.matchMedia(query),
): boolean {
  return matchMedia(MD_QUERY).matches;
}
