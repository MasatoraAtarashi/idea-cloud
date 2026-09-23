import { createMcpHandler } from "@modelcontextprotocol/server";
import { authorizeMcpRequest } from "./auth";
import { createIdeaCloudMcpServer } from "./server";

/**
 * Stateless Streamable HTTP MCP on the existing Worker.
 * A fresh server is built per request so tools read that request's D1 binding.
 * JSON responses: tool calls are short D1 reads/writes and do not stream.
 */
export function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  const denied = authorizeMcpRequest(request, env);
  if (denied) return Promise.resolve(denied);

  const handler = createMcpHandler(() => createIdeaCloudMcpServer(env), {
    responseMode: "json",
  });
  return handler.fetch(request);
}
