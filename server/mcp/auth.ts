import { createRootDb } from "../../db/client";
import { looksLikeWorkspaceApiKey, resolveApiKey } from "../../db/workspaces";
import { logDiag } from "../diag";
import { LEGACY_WORKSPACE_ID } from "../tenant/workspace";

/**
 * Bearer gate for `/mcp`. The supported credential is a per-workspace key
 * (`icw_…`, minted in 設定 → API キー, stored hashed). The env shared secret
 * (MCP_API_KEY / MCP_TOKEN) is legacy and only ever opens workspace 1.
 * Not OAuth and not the browser session.
 */

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

export type McpAuthorization = { workspaceId: number; via: "workspace_key" | "legacy_secret" };

function deny(error: string, env: Env): Response {
  logDiag("warn", "mcp auth", {
    step: "mcp",
    provider: "mcp",
    outcome: "fail",
    error,
    status: 401,
    hasMcpApiKey: Boolean(env.MCP_API_KEY?.trim()),
    hasMcpToken: Boolean(env.MCP_TOKEN?.trim()),
  });
  return unauthorizedMcpResponse();
}

/** The workspace the bearer opens, or a 401 response. */
export async function authorizeMcpRequest(
  request: Request,
  env: Env,
): Promise<McpAuthorization | Response> {
  const token = bearerToken(request.headers.get("authorization"));
  if (token == null) return deny("missing_bearer", env);

  if (looksLikeWorkspaceApiKey(token)) {
    const resolved = await resolveApiKey(createRootDb(env.DB), token);
    if (!resolved) return deny("unknown_key", env);
    return { workspaceId: resolved.workspaceId, via: "workspace_key" };
  }

  const secret = mcpSharedSecret(env);
  if (!secret) return deny("missing_key", env);
  if (!timingSafeEqualString(token, secret)) return deny("mismatch", env);
  return { workspaceId: LEGACY_WORKSPACE_ID, via: "legacy_secret" };
}
