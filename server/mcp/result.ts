export type McpToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export function toolJson(data: Record<string, unknown>): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

export function toolError(error: string, extra?: Record<string, unknown>): McpToolResult {
  const payload = { error, ...extra };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

export function parseToolJson(result: McpToolResult): Record<string, unknown> {
  const text = result.content[0]?.text ?? "";
  return JSON.parse(text) as Record<string, unknown>;
}
