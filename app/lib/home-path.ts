/** Tailwind `md` — desktop list vs mobile capture. */
export const MD_QUERY = "(min-width: 768px)";

/** `/app` is capture (mobile home). Desktop `/app` replaces to the list. */
export const CAPTURE_PATH = "/app";
export const CAPTURE_ALIAS = "/app/capture";
export const LIST_PATH = "/app/list";

export function homePath(isDesktop: boolean): typeof LIST_PATH | typeof CAPTURE_PATH {
  return isDesktop ? LIST_PATH : CAPTURE_PATH;
}

export function isCapturePath(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/" || pathname === "/app/capture";
}

export function isDesktopViewport(
  matchMedia: (query: string) => { matches: boolean } = (query) => window.matchMedia(query),
): boolean {
  return matchMedia(MD_QUERY).matches;
}
