import { describe, expect, it } from "vitest";
import { LITE_LLM_BACKGROUND, REJECTED_DARK_GOLD } from "../app/ui/tokens";
import { GOOGLE_LOGIN_CTA } from "../app/auth/google-login";
import { APP_SCREENS, STAGE_LABEL } from "../app/data/mock";

describe("light console tokens", () => {
  it("rejects the dark-gold palette", () => {
    expect(REJECTED_DARK_GOLD).toContain("#0c0e12");
    expect(REJECTED_DARK_GOLD).toContain("#d4a574");
    expect(LITE_LLM_BACKGROUND).toBe("oklch(1 0 0)");
  });

  it("keeps Japanese screen titles for remaining routes", () => {
    expect(APP_SCREENS.map((screen) => screen.title)).toContain("熟成ボード");
    expect(STAGE_LABEL.ripe).toBe("熟した");
    expect(GOOGLE_LOGIN_CTA).toContain("Google");
  });
});
