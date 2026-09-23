import { logDiag } from "../diag";

/** Shared-secret bearer gate for `/mcp`. Not OAuth and not the mock Google session. */

const REALM = "idea-cloud";

export function mcpSharedSecret(env: Env): string {
  const primary = env.MCP_API_KEY?.trim() ?? "";
  if (primary) return primary;
  return env.MCP_TOKEN?.trim() ?? "";
}

export function unauthorizedMcpResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "www-authenticate": `Bearer realm="${REALM}"`,
    },
  });
}

function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization);
  return match?.[1] ?? null;
}

/** Constant-time string compare. Length mismatch still scans the longer input. */
export function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** `null` when the bearer matches the configured secret. Otherwise a 401 response. */
export function authorizeMcpRequest(request: Request, env: Env): Response | null {
  const hasMcpApiKey = Boolean(env.MCP_API_KEY?.trim());
  const hasMcpToken = Boolean(env.MCP_TOKEN?.trim());
  const secret = mcpSharedSecret(env);
  const token = bearerToken(request.headers.get("authorization"));
  if (!secret || token == null || !timingSafeEqualString(token, secret)) {
    const error = !secret ? "missing_key" : token == null ? "missing_bearer" : "mismatch";
    logDiag("warn", "mcp auth", {
      step: "mcp",
      provider: "mcp",
      outcome: "fail",
      error,
      status: 401,
      hasMcpApiKey,
      hasMcpToken,
    });
    return unauthorizedMcpResponse();
  }
  return null;
}
