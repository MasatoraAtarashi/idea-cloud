import { describe, expect, it } from "vitest";
import {
  decryptField,
  encryptField,
  FieldCryptoError,
  parseKeyHex,
} from "../server/security/field-crypto";

const TEST_KEY = "a".repeat(64);

describe("field-crypto", () => {
  it("同じ平文を暗号化しても IV が変わる", async () => {
    const a = await encryptField("熟成させたいメモ", TEST_KEY);
    const b = await encryptField("熟成させたいメモ", TEST_KEY);
    expect(a).not.toBe(b);
    expect(await decryptField(a, TEST_KEY)).toBe("熟成させたいメモ");
    expect(await decryptField(b, TEST_KEY)).toBe("熟成させたいメモ");
  });

  it("鍵が 32 バイト hex でなければ失敗する", () => {
    expect(() => parseKeyHex("short")).toThrow(FieldCryptoError);
    expect(() => parseKeyHex(undefined)).toThrow(FieldCryptoError);
  });
});
