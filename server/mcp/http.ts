import { createMcpHandler } from "@modelcontextprotocol/server";
import { authorizeMcpRequest } from "./auth";
import { createIdeaCloudMcpServer } from "./server";

/**
 * Stateless Streamable HTTP MCP on the existing Worker.
 * A fresh server is built per request so tools read that request's D1 binding
 * and are scoped to the workspace the bearer key belongs to.
 * JSON responses: tool calls are short D1 reads/writes and do not stream.
 */
export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  const authorized = await authorizeMcpRequest(request, env);
  if (authorized instanceof Response) return authorized;

  const handler = createMcpHandler(() => createIdeaCloudMcpServer(env, authorized.workspaceId), {
    responseMode: "json",
  });
  return handler.fetch(request);
}
