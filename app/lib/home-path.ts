/** Tailwind `md` — desktop list home vs mobile capture home. */
export const MD_QUERY = "(min-width: 768px)";

/** Desktop list home. `/app/list` is the same list for mobile 一覧. */
export const LIST_PATH = "/app";
export const MOBILE_LIST_PATH = "/app/list";
export const CAPTURE_PATH = "/app/capture";

export function homePath(isDesktop: boolean): typeof LIST_PATH | typeof CAPTURE_PATH {
  return isDesktop ? LIST_PATH : CAPTURE_PATH;
}

export function isDesktopViewport(
  matchMedia: (query: string) => { matches: boolean } = (query) => window.matchMedia(query),
): boolean {
  return matchMedia(MD_QUERY).matches;
}
