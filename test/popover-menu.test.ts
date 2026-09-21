import { describe, expect, it } from "vitest";
import { placeMenu } from "../app/components/popover-menu";

describe("popover menu placement", () => {
  it("flips above when there is no room below and stays on-screen", () => {
    const low = placeMenu(
      { top: 700, right: 390, bottom: 744, left: 350 },
      { width: 390, height: 760 },
    );
    expect(low.top).toBeLessThan(700);
    expect(low.left).toBeGreaterThanOrEqual(8);
    expect(low.left + 208).toBeLessThanOrEqual(390 - 8);
    expect(low.maxHeight).toBeGreaterThanOrEqual(160);

    const high = placeMenu(
      { top: 12, right: 48, bottom: 48, left: 8 },
      { width: 390, height: 760 },
      208,
      "start",
    );
    expect(high.top).toBeGreaterThanOrEqual(48);
    expect(high.left).toBeGreaterThanOrEqual(8);
  });
});
