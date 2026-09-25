/**
 * The native app presents a Google `id_token` it got on-device, so unlike the
 * web code-exchange flow nothing about it is trusted until checked here.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resetJwksCacheForTest, verifyGoogleIdToken } from "../server/auth/google-id-token";

const AUDIENCE = "ios-client.apps.googleusercontent.com";
const KID = "test-key";

let keyPair: CryptoKeyPair;
let jwks: { keys: unknown[] };

function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function encodeJson(value: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(value)));
}

async function mintToken(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: "RS256", kid: KID },
): Promise<string> {
  const body = `${encodeJson(header)}.${encodeJson(payload)}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(body),
  );
  return `${body}.${b64url(new Uint8Array(signature))}`;
}

/** A token Google would have issued a minute ago, valid for the hour. */
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "https://accounts.google.com",
    aud: AUDIENCE,
    email: "owner@example.com",
    email_verified: true,
    iat: now - 60,
    exp: now + 3540,
    ...overrides,
  };
}

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  jwks = { keys: [{ ...jwk, kid: KID, alg: "RS256", use: "sig" }] };
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify(jwks), { status: 200 }));
});

afterEach(() => resetJwksCacheForTest());

describe("verifyGoogleIdToken", () => {
  it("accepts a well-formed token and returns the email", async () => {
    const token = await mintToken(validPayload());
    expect(await verifyGoogleIdToken(token, [AUDIENCE])).toBe("owner@example.com");
  });

  it("rejects a token minted for another client", async () => {
    const token = await mintToken(validPayload({ aud: "someone-elses-client" }));
    expect(await verifyGoogleIdToken(token, [AUDIENCE])).toBeNull();
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await mintToken(validPayload({ iat: now - 7200, exp: now - 3600 }));
    expect(await verifyGoogleIdToken(token, [AUDIENCE])).toBeNull();
  });

  it("rejects an unverified email", async () => {
    const token = await mintToken(validPayload({ email_verified: false }));
    expect(await verifyGoogleIdToken(token, [AUDIENCE])).toBeNull();
  });

  it("rejects another issuer", async () => {
    const token = await mintToken(validPayload({ iss: "https://evil.example.com" }));
    expect(await verifyGoogleIdToken(token, [AUDIENCE])).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await mintToken(validPayload());
    const [header, , signature] = token.split(".");
    const forged = encodeJson(validPayload({ email: "attacker@example.com" }));
    expect(await verifyGoogleIdToken(`${header}.${forged}.${signature}`, [AUDIENCE])).toBeNull();
  });

  it('rejects alg "none", where the signature is empty', async () => {
    const header = encodeJson({ alg: "none", kid: KID });
    const payload = encodeJson(validPayload());
    expect(await verifyGoogleIdToken(`${header}.${payload}.x`, [AUDIENCE])).toBeNull();
  });

  it("rejects everything when no audience is configured", async () => {
    const token = await mintToken(validPayload());
    expect(await verifyGoogleIdToken(token, [])).toBeNull();
  });

  it("ignores a Bearer value that is not a JWT", async () => {
    expect(await verifyGoogleIdToken("plain-app-token", [AUDIENCE])).toBeNull();
  });
});
