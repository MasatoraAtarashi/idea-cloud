import { logger } from "./logger";

type DiagValue = string | number | boolean | null;

/** Structured diagnostic line. Callers must not pass secrets, prompts, or raw URLs. */
export function logDiag(level: "info" | "warn", msg: string, fields: Record<string, DiagValue>) {
  logger[level](msg, fields);
}

export function logCreatePrerequisites(env: {
  TYPESAFE_API_KEY?: string;
  SEARCH_API_KEY?: string;
}) {
  logDiag("info", "create prerequisites", {
    step: "create",
    outcome: "start",
    hasTypesafeApiKey: Boolean(env.TYPESAFE_API_KEY?.trim()),
    hasSearchApiKey: Boolean(env.SEARCH_API_KEY?.trim()),
  });
}

export function errorClass(error: unknown): string {
  if (!(error instanceof Error)) return "error";
  if (error.name === "AbortError" || error.name === "TimeoutError") return "timeout";
  if (error.name === "DiscussNoRoomError") return "truncated";
  if (error.name === "PublicUrlRejectedError") {
    const code = "code" in error && typeof error.code === "string" ? error.code : "";
    return code || "rejected_url";
  }
  const message = error.message;
  if (message === "Workers AI binding is missing") return "missing_binding";
  if (message === "TYPESAFE_API_KEY is missing") return "missing_key";
  if (message === "TypeSafe request timed out" || message === "timeout") return "timeout";
  if (message === "TypeSafe request failed" || message === "fetch") return "network";
  if (message.startsWith("TypeSafe request failed (")) return "http";
  if (message.startsWith("status ")) return "http";
  if (
    message.startsWith("empty ") ||
    message.includes("is empty") ||
    message.includes("is missing") ||
    message.includes("not JSON") ||
    message.includes("unsupported")
  ) {
    return "parse";
  }
  if (message === "redirect" || message === "too many redirects") return "redirect";
  if (message === "content-type") return "content_type";
  return "exception";
}

export function statusFromError(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const match = /(?:failed \(|^status )(\d+)/.exec(error.message);
  if (!match?.[1]) return null;
  const status = Number(match[1]);
  return Number.isInteger(status) ? status : null;
}

export function hostOnly(raw: string): string | null {
  try {
    return new URL(raw).hostname || null;
  } catch {
    return null;
  }
}
