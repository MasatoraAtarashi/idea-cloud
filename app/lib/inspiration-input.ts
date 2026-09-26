import { dictionary, type Dictionary } from "../i18n/dictionary";

export const INSPIRATION_TITLE_MAX = 200;
export const INSPIRATION_MEMO_MAX = 4000;
export const INSPIRATION_URL_MAX = 2000;

const JA = dictionary("ja").inspiration;

/**
 * Japanese copies of the validation messages, for callers outside the request
 * cycle (the MCP tools) that match on the message rather than render it.
 */
export const INSPIRATION_EMPTY_MESSAGE = JA.errors.empty;
export const INSPIRATION_URL_FORMAT_MESSAGE = JA.errors.urlFormat;
export const INSPIRATION_URL_PROTOCOL_MESSAGE = JA.errors.urlProtocol;
export const INSPIRATION_TITLE_TOO_LONG_MESSAGE = JA.errors.titleTooLong;
export const INSPIRATION_MEMO_TOO_LONG_MESSAGE = JA.errors.memoTooLong;
export const INSPIRATION_URL_TOO_LONG_MESSAGE = JA.errors.urlTooLong;

/**
 * Stored placeholder title. It lands in the database, so it stays one value
 * across locales; the UI shows `t.inspiration.untitled` in its place.
 */
export const INSPIRATION_UNTITLED = JA.untitled;

const INVISIBLE_RE = /[\u200B-\u200D\uFEFF]/g;
const CONTROL_RE = /[\u0000-\u001F\u007F]/g;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const BARE_URL_RE =
  /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export type PreparedInspiration = {
  title: string;
  url: string | null;
  memo: string;
  tags: string[];
  /** False when the title was left empty and may be replaced by a page title. */
  titleFromUser: boolean;
};

export function stripPastedUrl(raw: string): string {
  let value = raw.replace(INVISIBLE_RE, "").replace(CONTROL_RE, "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("「") && value.endsWith("」"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Card title when the user did not type one: path slug, otherwise hostname. */
export function fallbackTitleFromUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const last = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    const slug = safeDecode(last)
      .replace(/\.(?:html?|php|aspx?|jsp|cgi|shtml)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (slug.length >= 2 && !/^\d+$/.test(slug)) {
      return slug.slice(0, INSPIRATION_TITLE_MAX);
    }
    const host = url.hostname.replace(/^www\./i, "");
    return host.slice(0, INSPIRATION_TITLE_MAX) || INSPIRATION_UNTITLED;
  } catch {
    return INSPIRATION_UNTITLED;
  }
}

/**
 * Accept http(s), trim mobile paste, and prepend https:// for a bare host/path.
 * Empty input is not an error — the URL field is optional.
 */
export function normalizeInspirationInputUrl(
  t: Dictionary,
  raw: string,
): { url: string } | { error: string } {
  const cleaned = stripPastedUrl(raw);
  if (!cleaned) return { url: "" };
  if (cleaned.length > INSPIRATION_URL_MAX) {
    return { error: t.inspiration.errors.urlTooLong };
  }
  if (/\s/.test(cleaned)) {
    return { error: t.inspiration.errors.urlFormat };
  }

  let candidate = cleaned;
  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (!SCHEME_RE.test(candidate)) {
    if (!BARE_URL_RE.test(candidate)) {
      return { error: t.inspiration.errors.urlFormat };
    }
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: t.inspiration.errors.urlFormat };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: t.inspiration.errors.urlProtocol };
  }
  if (!parsed.hostname) {
    return { error: t.inspiration.errors.urlFormat };
  }
  if (parsed.href.length > INSPIRATION_URL_MAX) {
    return { error: t.inspiration.errors.urlTooLong };
  }
  return { url: parsed.href };
}

function singleUrlToken(t: Dictionary, raw: string): string | null {
  const cleaned = stripPastedUrl(raw);
  if (!cleaned || /\s/.test(cleaned)) return null;
  const normalized = normalizeInspirationInputUrl(t, cleaned);
  if (!("url" in normalized) || !normalized.url) return null;
  return normalized.url;
}

export function prepareInspirationInput(
  t: Dictionary,
  input: {
    title?: string | null;
    url?: string | null;
    memo?: string | null;
    tags?: string[] | null;
  },
): { ok: true; value: PreparedInspiration } | { ok: false; error: string } {
  const memo = (input.memo ?? "").trim();
  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
  let titleRaw = (input.title ?? "").trim();

  if (titleRaw.length > INSPIRATION_TITLE_MAX) {
    return { ok: false, error: t.inspiration.errors.titleTooLong };
  }
  if (memo.length > INSPIRATION_MEMO_MAX) {
    return { ok: false, error: t.inspiration.errors.memoTooLong };
  }

  const normalized = normalizeInspirationInputUrl(t, input.url ?? "");
  if ("error" in normalized) return { ok: false, error: normalized.error };

  let url = normalized.url || null;
  let titleFromUser = titleRaw.length > 0;

  if (!url && titleRaw) {
    const promoted = singleUrlToken(t, titleRaw);
    if (promoted) {
      url = promoted;
      titleRaw = "";
      titleFromUser = false;
    }
  } else if (url && titleFromUser && singleUrlToken(t, titleRaw) === url) {
    titleRaw = "";
    titleFromUser = false;
  }

  if (!titleRaw && !memo && !url) {
    return { ok: false, error: t.inspiration.errors.empty };
  }

  const title = titleFromUser
    ? titleRaw
    : url
      ? fallbackTitleFromUrl(url)
      : memo.slice(0, INSPIRATION_TITLE_MAX) || INSPIRATION_UNTITLED;

  return {
    ok: true,
    value: { title, url, memo, tags, titleFromUser },
  };
}

/** True when the stored title was filled in for the user, so a later page title can replace it. */
export function isDerivedInspirationTitle(title: string, url: string | null | undefined): boolean {
  const trimmed = title.trim();
  const rawUrl = url?.trim() ?? "";
  if (!trimmed || trimmed === INSPIRATION_UNTITLED || (rawUrl && trimmed === rawUrl)) return true;
  if (!rawUrl) return false;
  return trimmed === fallbackTitleFromUrl(rawUrl);
}

/** Keep a typed title. Otherwise prefer the fetched page title over the slug/host. */
export function displayTitleForSave(
  prepared: PreparedInspiration,
  ogTitle?: string | null,
): string {
  if (prepared.titleFromUser) return prepared.title;
  const og = ogTitle?.trim() ?? "";
  if (prepared.url && og) return og.slice(0, INSPIRATION_TITLE_MAX);
  return prepared.title;
}
