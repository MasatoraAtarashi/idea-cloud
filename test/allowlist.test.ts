import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowlist } from "../server/security/allowlist";

describe("allowlist", () => {
  it("未設定なら認証済みメールをすべて許可する", () => {
    expect(isEmailAllowed("anyone@example.com", undefined)).toBe(true);
    expect(isEmailAllowed("anyone@example.com", "")).toBe(true);
    expect(parseAllowlist("  ")).toEqual([]);
  });

  it("カンマ区切りを小文字化して一致判定する", () => {
    const csv = " atarashi.masatora@gmail.com , Mei@example.com ";
    expect(parseAllowlist(csv)).toEqual(["atarashi.masatora@gmail.com", "mei@example.com"]);
    expect(isEmailAllowed("ATARASHI.MASATORA@gmail.com", csv)).toBe(true);
    expect(isEmailAllowed("stranger@example.com", csv)).toBe(false);
  });
});
