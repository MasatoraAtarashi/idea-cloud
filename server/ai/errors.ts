/**
 * What went wrong, as a value rather than a sentence. The HTTP body still
 * carries a Japanese `error` for the API and MCP clients that already read it,
 * but screens render their own copy from this code, so the UI never shows a
 * server-authored sentence in the wrong language.
 */
export type AiErrorCode =
  | "notFound"
  | "archived"
  | "failed"
  /** The model ran out of room before finishing its answer. */
  | "noRoom"
  | "badRequest"
  | "empty"
  | "tooLong";

export type AiFailure = {
  ok: false;
  status: 400 | 404 | 409 | 502;
  code: AiErrorCode;
  /** Japanese, for API/MCP callers. Not for the UI. */
  error: string;
};

export function aiFailure(
  status: AiFailure["status"],
  code: AiErrorCode,
  error: string,
): AiFailure {
  return { ok: false, status, code, error };
}
