/**
 * AES-GCM helper for sensitive fields written to D1.
 * Wiring into idea bodies is a later phase. Key lives in wrangler secret / .dev.vars only.
 */
const IV_BYTES = 12;

export class FieldCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FieldCryptoError";
  }
}

export function parseKeyHex(keyHex: string | undefined): Uint8Array {
  const trimmed = keyHex?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new FieldCryptoError("FIELD_ENCRYPTION_KEY must be 32-byte hex (64 characters)");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    bytes[i] = Number.parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Workers / TS 6 BufferSource is ArrayBuffer. Copy to drop SharedArrayBuffer. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function importAesKey(raw: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toArrayBuffer(raw), "AES-GCM", false, usage);
}

export async function encryptField(plaintext: string, keyHex: string | undefined): Promise<string> {
  const key = await importAesKey(parseKeyHex(keyHex), ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, encoded),
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}`;
}

export async function decryptField(payload: string, keyHex: string | undefined): Promise<string> {
  const [ivPart, dataPart] = payload.split(".");
  if (!ivPart || !dataPart) {
    throw new FieldCryptoError("Invalid ciphertext format");
  }
  const key = await importAesKey(parseKeyHex(keyHex), ["decrypt"]);
  const iv = base64ToBytes(ivPart);
  const data = base64ToBytes(dataPart);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data),
  );
  return new TextDecoder().decode(plain);
}
