export const INSPIRATION_TITLE_MAX = 200;
export const INSPIRATION_MEMO_MAX = 4000;
export const INSPIRATION_URL_MAX = 2000;

export const INSPIRATION_EMPTY_MESSAGE = "入力してください";
export const INSPIRATION_URL_FORMAT_MESSAGE = "URLの形式が正しくありません";
export const INSPIRATION_URL_PROTOCOL_MESSAGE = "http または https のURLにしてください";
export const INSPIRATION_TITLE_TOO_LONG_MESSAGE = "タイトルが長すぎます";
export const INSPIRATION_MEMO_TOO_LONG_MESSAGE = "メモが長すぎます";
export const INSPIRATION_URL_TOO_LONG_MESSAGE = "URLが長すぎます";

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
    return host.slice(0, INSPIRATION_TITLE_MAX) || "無題";
  } catch {
    return "無題";
  }
}

/**
 * Accept http(s), trim mobile paste, and prepend https:// for a bare host/path.
 * Empty input is not an error — the URL field is optional.
 */
export function normalizeInspirationInputUrl(raw: string): { url: string } | { error: string } {
  const cleaned = stripPastedUrl(raw);
  if (!cleaned) return { url: "" };
  if (cleaned.length > INSPIRATION_URL_MAX) {
    return { error: INSPIRATION_URL_TOO_LONG_MESSAGE };
  }
  if (/\s/.test(cleaned)) {
    return { error: INSPIRATION_URL_FORMAT_MESSAGE };
  }

  let candidate = cleaned;
  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (!SCHEME_RE.test(candidate)) {
    if (!BARE_URL_RE.test(candidate)) {
      return { error: INSPIRATION_URL_FORMAT_MESSAGE };
    }
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: INSPIRATION_URL_FORMAT_MESSAGE };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: INSPIRATION_URL_PROTOCOL_MESSAGE };
  }
  if (!parsed.hostname) {
    return { error: INSPIRATION_URL_FORMAT_MESSAGE };
  }
  if (parsed.href.length > INSPIRATION_URL_MAX) {
    return { error: INSPIRATION_URL_TOO_LONG_MESSAGE };
  }
  return { url: parsed.href };
}

function singleUrlToken(raw: string): string | null {
  const cleaned = stripPastedUrl(raw);
  if (!cleaned || /\s/.test(cleaned)) return null;
  const normalized = normalizeInspirationInputUrl(cleaned);
  if (!("url" in normalized) || !normalized.url) return null;
  return normalized.url;
}

export function prepareInspirationInput(input: {
  title?: string | null;
  url?: string | null;
  memo?: string | null;
  tags?: string[] | null;
}): { ok: true; value: PreparedInspiration } | { ok: false; error: string } {
  const memo = (input.memo ?? "").trim();
  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
  let titleRaw = (input.title ?? "").trim();

  if (titleRaw.length > INSPIRATION_TITLE_MAX) {
    return { ok: false, error: INSPIRATION_TITLE_TOO_LONG_MESSAGE };
  }
  if (memo.length > INSPIRATION_MEMO_MAX) {
    return { ok: false, error: INSPIRATION_MEMO_TOO_LONG_MESSAGE };
  }

  const normalized = normalizeInspirationInputUrl(input.url ?? "");
  if ("error" in normalized) return { ok: false, error: normalized.error };

  let url = normalized.url || null;
  let titleFromUser = titleRaw.length > 0;

  if (!url && titleRaw) {
    const promoted = singleUrlToken(titleRaw);
    if (promoted) {
      url = promoted;
      titleRaw = "";
      titleFromUser = false;
    }
  } else if (url && titleFromUser && singleUrlToken(titleRaw) === url) {
    titleRaw = "";
    titleFromUser = false;
  }

  if (!titleRaw && !memo && !url) {
    return { ok: false, error: INSPIRATION_EMPTY_MESSAGE };
  }

  const title = titleFromUser
    ? titleRaw
    : url
      ? fallbackTitleFromUrl(url)
      : memo.slice(0, INSPIRATION_TITLE_MAX) || "無題";

  return {
    ok: true,
    value: { title, url, memo, tags, titleFromUser },
  };
}

/** True when the stored title was filled in for the user, so a later page title can replace it. */
export function isDerivedInspirationTitle(title: string, url: string | null | undefined): boolean {
  const trimmed = title.trim();
  const rawUrl = url?.trim() ?? "";
  if (!trimmed || trimmed === "無題" || (rawUrl && trimmed === rawUrl)) return true;
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
