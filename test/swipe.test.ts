import { describe, expect, it } from "vitest";
import {
  clampSwipeOffset,
  DETAIL_SWIPE_BUTTON_WIDTH,
  SWIPE_BUTTON_WIDTH,
  swipePanelWidth,
  swipeSnapOffset,
} from "../app/lib/swipe";

describe("swipe helpers", () => {
  it("keeps list buttons at 88px and detail buttons narrower so four actions fit", () => {
    expect(SWIPE_BUTTON_WIDTH).toBe(88);
    expect(DETAIL_SWIPE_BUTTON_WIDTH).toBe(72);
    expect(swipePanelWidth(2)).toBe(176);
    expect(swipePanelWidth(4, DETAIL_SWIPE_BUTTON_WIDTH)).toBe(288);
    expect(swipePanelWidth(4, DETAIL_SWIPE_BUTTON_WIDTH)).toBeLessThanOrEqual(288);
    expect(swipePanelWidth(0)).toBe(0);
  });

  it("snaps open past half a button and otherwise closed", () => {
    expect(swipeSnapOffset(0, 176)).toBe(0);
    expect(swipeSnapOffset(44, 176)).toBe(0);
    expect(swipeSnapOffset(45, 176)).toBe(176);
    expect(swipeSnapOffset(37, 288, DETAIL_SWIPE_BUTTON_WIDTH)).toBe(288);
    expect(swipeSnapOffset(10, 0)).toBe(0);
  });

  it("clamps the drag offset to the panel", () => {
    expect(clampSwipeOffset(-20, 176)).toBe(0);
    expect(clampSwipeOffset(80, 176)).toBe(80);
    expect(clampSwipeOffset(200, 176)).toBe(176);
  });
});
