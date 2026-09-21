export const SWIPE_BUTTON_WIDTH = 88;

/** Four detail actions still fit a 320px viewport after page padding. */
export const DETAIL_SWIPE_BUTTON_WIDTH = 72;

export function swipePanelWidth(actionCount: number, buttonWidth = SWIPE_BUTTON_WIDTH): number {
  return Math.max(0, actionCount) * buttonWidth;
}

/** Snap open if the finger traveled past half a button, otherwise closed. */
export function swipeSnapOffset(
  offset: number,
  width: number,
  buttonWidth = SWIPE_BUTTON_WIDTH,
): number {
  if (width <= 0) return 0;
  return offset > buttonWidth / 2 ? width : 0;
}

export function clampSwipeOffset(offset: number, width: number): number {
  return Math.max(0, Math.min(width, offset));
}
