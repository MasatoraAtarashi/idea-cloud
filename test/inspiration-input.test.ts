import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { createInspirationAction } from "../app/lib/inspiration-action";
import {
  fallbackTitleFromUrl,
  isDerivedInspirationTitle,
  normalizeInspirationInputUrl,
  prepareInspirationInput,
} from "../app/lib/inspiration-input";
import { setTestOgpFetch } from "../server/ogp/fetch";

const SAMPLE = "http://www.sc-runner.com/2013/10/kinovea-tutorial.html";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...authHeaders, "content-type": "application/json", ...init?.headers },
  });
}

function createActionArgs(fields: Record<string, string>): ActionFunctionArgs {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return {
    request: new Request("https://example.com/app/inspirations", {
      method: "POST",
      body: form,
    }),
    params: {},
    context: {
      cloudflare: {
        env,
        ctx: { waitUntil() {} },
      },
    },
  } as unknown as ActionFunctionArgs;
}

describe("inspiration URL paste", () => {
  it("accepts http, trims mobile paste, and adds https to a bare host", () => {
    expect(normalizeInspirationInputUrl(`  ${SAMPLE}\n`)).toEqual({ url: SAMPLE });
    expect(normalizeInspirationInputUrl(`${SAMPLE}\u200B`)).toEqual({ url: SAMPLE });
    expect(normalizeInspirationInputUrl("www.sc-runner.com/2013/10/kinovea-tutorial.html")).toEqual(
      { url: "https://www.sc-runner.com/2013/10/kinovea-tutorial.html" },
    );
    expect(normalizeInspirationInputUrl("")).toEqual({ url: "" });
    expect(fallbackTitleFromUrl(SAMPLE)).toBe("kinovea tutorial");
    expect(fallbackTitleFromUrl("https://example.com/2013/10/")).toBe("example.com");
    expect(isDerivedInspirationTitle("kinovea tutorial", SAMPLE)).toBe(true);
    expect(isDerivedInspirationTitle("自分の題", SAMPLE)).toBe(false);
  });

  it("allows an empty title when a URL or memo is present", () => {
    const urlOnly = prepareInspirationInput({ title: "  ", url: SAMPLE });
    expect(urlOnly.ok).toBe(true);
    if (urlOnly.ok) {
      expect(urlOnly.value.titleFromUser).toBe(false);
      expect(urlOnly.value.url).toBe(SAMPLE);
      expect(urlOnly.value.title).toBe("kinovea tutorial");
    }

    const memoOnly = prepareInspirationInput({ memo: "あとで見る" });
    expect(memoOnly.ok).toBe(true);
    if (memoOnly.ok) expect(memoOnly.value.title).toBe("あとで見る");

    const empty = prepareInspirationInput({ title: "", url: " \n " });
    expect(empty).toEqual({ ok: false, error: "入力してください" });

    const junk = prepareInspirationInput({ url: "メモだけどURL欄" });
    expect(junk).toEqual({ ok: false, error: "URLの形式が正しくありません" });
    expect(normalizeInspirationInputUrl("ftp://example.com/file")).toEqual({
      error: "http または https のURLにしてください",
    });
  });
});

describe("inspiration create action", () => {
  afterEach(() => {
    setTestOgpFetch();
  });

  it("saves a mobile-style http paste without a title", async () => {
    setTestOgpFetch(async () => ({
      status: "ok",
      title: "Kinovea tutorial",
      description: "",
      imageUrl: "",
      siteName: "",
      fetchedAt: "2026-09-24 00:00:00",
    }));
    const result = await createInspirationAction(
      createActionArgs({
        title: "",
        url: `\n ${SAMPLE} \n`,
        memo: "",
        tags: "",
      }),
    );
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    const location = response.headers.get("Location") ?? "";
    expect(location).toMatch(/\/app\/inspirations\/\d+$/);

    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { title: string; url: string | null }[] };
    const row = listed.items.find((item) => item.url === SAMPLE);
    expect(row?.title).toBe("Kinovea tutorial");
  });

  it("keeps a typed title and still accepts the http URL", async () => {
    setTestOgpFetch(async () => {
      throw new Error("down");
    });
    const result = await createInspirationAction(
      createActionArgs({
        title: "自分の題",
        url: SAMPLE,
        memo: "",
      }),
    );
    expect(result).toBeInstanceOf(Response);
    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { title: string; url: string | null }[] };
    expect(listed.items.some((item) => item.url === SAMPLE && item.title === "自分の題")).toBe(
      true,
    );
  });
});
