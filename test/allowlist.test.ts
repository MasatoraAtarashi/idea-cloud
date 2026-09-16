import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowlist } from "../server/security/allowlist";

describe("allowlist", () => {
  it("allows every authenticated email when unset", () => {
    expect(isEmailAllowed("anyone@example.com", undefined)).toBe(true);
    expect(isEmailAllowed("anyone@example.com", "")).toBe(true);
    expect(parseAllowlist("  ")).toEqual([]);
  });

  it("normalizes comma-separated emails to lowercase", () => {
    const csv = " atarashi.masatora@gmail.com , Mei@example.com ";
    expect(parseAllowlist(csv)).toEqual(["atarashi.masatora@gmail.com", "mei@example.com"]);
    expect(isEmailAllowed("ATARASHI.MASATORA@gmail.com", csv)).toBe(true);
    expect(isEmailAllowed("stranger@example.com", csv)).toBe(false);
  });
});
