/** Public http(s) URL checks for OGP fetch. Blocks private IPs and obvious SSRF targets. */

export const OGP_URL_MAX = 2000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.",
  "metadata.google.internal",
  "metadata.google.internal.",
  "metadata",
  "metadata.",
]);

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home"];

export type PublicUrlError =
  "invalid" | "protocol" | "credentials" | "host" | "private" | "too_long";

export class PublicUrlRejectedError extends Error {
  readonly code: PublicUrlError;

  constructor(code: PublicUrlError, message: string) {
    super(message);
    this.name = "PublicUrlRejectedError";
    this.code = code;
  }
}

export function isIpv4Literal(host: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
}

export function parseIpv4(host: string): [number, number, number, number] | null {
  if (!isIpv4Literal(host)) return null;
  const parts = host.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return null;
  }
  return [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
}

export function isPrivateIpv4(host: string): boolean {
  const ip = parseIpv4(host);
  if (!ip) return false;
  const [a, b] = ip;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0 && ip[2] === 2) return true; // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && b === 51 && ip[2] === 100) return true; // 198.51.100.0/24
  if (a === 203 && b === 0 && ip[2] === 113) return true; // 203.0.113.0/24
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

export function isPrivateIpv6(host: string): boolean {
  const raw = host
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  if (!raw.includes(":")) return false;
  if (raw === "::" || raw === "::1") return true;
  if (raw.startsWith("fe80:") || raw.startsWith("fe80::")) return true; // link-local
  if (raw.startsWith("fc") || raw.startsWith("fd")) return true; // unique local
  if (raw.startsWith("ff")) return true; // multicast
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped?.[1] && isPrivateIpv4(mapped[1])) return true;
  return false;
}

function hostnameOf(url: URL): string {
  return url.hostname.trim().toLowerCase().replace(/\.$/, "");
}

export function isBlockedHostname(host: string): boolean {
  const name = host.trim().toLowerCase().replace(/\.$/, "");
  if (!name) return true;
  if (BLOCKED_HOSTS.has(name) || BLOCKED_HOSTS.has(`${name}.`)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true;
  if (name.endsWith(".localhost")) return true;
  return false;
}

export function assertPublicHttpUrl(raw: string, options?: { httpsOnly?: boolean }): URL {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new PublicUrlRejectedError("invalid", "URL is empty");
  }
  if (trimmed.length > OGP_URL_MAX) {
    throw new PublicUrlRejectedError("too_long", "URL is too long");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new PublicUrlRejectedError("invalid", "URL is invalid");
  }

  const httpsOnly = options?.httpsOnly ?? false;
  if (httpsOnly && parsed.protocol !== "https:") {
    throw new PublicUrlRejectedError("protocol", "Only https URLs are allowed");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PublicUrlRejectedError("protocol", "Only http(s) URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new PublicUrlRejectedError("credentials", "URLs with credentials are blocked");
  }

  const host = hostnameOf(parsed);
  if (!host) {
    throw new PublicUrlRejectedError("host", "Host is missing");
  }
  if (isBlockedHostname(host)) {
    throw new PublicUrlRejectedError("host", "Host is not allowed");
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    throw new PublicUrlRejectedError("private", "Private or reserved addresses are blocked");
  }
  return parsed;
}

export function isPublicHttpUrl(raw: string, options?: { httpsOnly?: boolean }): boolean {
  try {
    assertPublicHttpUrl(raw, options);
    return true;
  } catch {
    return false;
  }
}

export function hostnameFromUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  try {
    return hostnameOf(new URL(raw.trim()));
  } catch {
    return "";
  }
}
