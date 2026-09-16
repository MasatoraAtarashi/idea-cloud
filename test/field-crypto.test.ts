import { describe, expect, it } from "vitest";
import {
  decryptField,
  encryptField,
  FieldCryptoError,
  parseKeyHex,
} from "../server/security/field-crypto";

const TEST_KEY = "a".repeat(64);

describe("field-crypto", () => {
  it("uses a new IV for the same plaintext", async () => {
    const a = await encryptField("熟成させたいメモ", TEST_KEY);
    const b = await encryptField("熟成させたいメモ", TEST_KEY);
    expect(a).not.toBe(b);
    expect(await decryptField(a, TEST_KEY)).toBe("熟成させたいメモ");
    expect(await decryptField(b, TEST_KEY)).toBe("熟成させたいメモ");
  });

  it("rejects a key that is not 32-byte hex", () => {
    expect(() => parseKeyHex("short")).toThrow(FieldCryptoError);
    expect(() => parseKeyHex(undefined)).toThrow(FieldCryptoError);
  });
});
