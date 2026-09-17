/** Tailwind `md` — desktop list vs mobile compose. */
export const MD_QUERY = "(min-width: 768px)";

/** `/app` is new-idea compose (mobile home). Desktop `/app` replaces to the list. */
export const NEW_IDEA_PATH = "/app";
export const NEW_IDEA_ALIAS = "/app/capture";
export const LIST_PATH = "/app/list";
export const SETTINGS_PATH = "/app/settings";

export function homePath(isDesktop: boolean): typeof LIST_PATH | typeof NEW_IDEA_PATH {
  return isDesktop ? LIST_PATH : NEW_IDEA_PATH;
}

export function isComposePath(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/" || pathname === "/app/capture";
}

export function isDesktopViewport(
  matchMedia: (query: string) => { matches: boolean } = (query) => window.matchMedia(query),
): boolean {
  return matchMedia(MD_QUERY).matches;
}
