/** Desktop compose shortcuts. ⌘ on Mac, Ctrl elsewhere. */

export function hasMod(event: { metaKey: boolean; ctrlKey: boolean }): boolean {
  return event.metaKey || event.ctrlKey;
}

export function isNewIdeaShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  isComposing?: boolean;
  repeat?: boolean;
}): boolean {
  if (event.isComposing || event.repeat) return false;
  return hasMod(event) && event.key.toLowerCase() === "n";
}

export function isSubmitShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  isComposing?: boolean;
}): boolean {
  if (event.isComposing) return false;
  return hasMod(event) && event.key === "Enter";
}
