import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import {
  excerptAroundUrl,
  extractHttpUrls,
  IDEA_URL_INSPIRATION_CAP,
  normalizeInspirationUrl,
  titleFromUrlContext,
} from "../app/lib/idea-urls";
import { safeUpsertInspirationsFromIdeaText } from "../db/inspirations";
import { setTestOgpFetch } from "../server/ogp/fetch";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...authHeaders, "content-type": "application/json", ...init?.headers },
  });
}

function detailActionArgs(ideaId: number, fields: Record<string, string>): ActionFunctionArgs {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return {
    request: new Request(`https://example.com/app/ideas/${ideaId}`, {
      method: "POST",
      body: form,
    }),
    params: { ideaId: String(ideaId) },
    context: {
      cloudflare: {
        env,
        ctx: { waitUntil() {} },
      },
    },
  } as unknown as ActionFunctionArgs;
}

describe("idea URL extraction", () => {
  it("keeps distinct http(s) URLs and strips trailing punctuation", () => {
    const text =
      "見て https://example.com/a. と https://example.com/a/ と https://example.com/a と ftp://skip.example";
    expect(extractHttpUrls(text)).toEqual(["https://example.com/a"]);
    expect(normalizeInspirationUrl("https://WWW.Example.com/a/")).toBe("https://www.example.com/a");
  });

  it("caps at five distinct URLs and skips credentials", () => {
    const urls = Array.from({ length: 7 }, (_, index) => `https://example.com/cap-${index}`);
    expect(extractHttpUrls(urls.join("\n"))).toHaveLength(IDEA_URL_INSPIRATION_CAP);
    expect(extractHttpUrls("https://user:secret@example.com/hidden")).toEqual([]);
  });

  it("titles from markdown, same-line context, or hostname", () => {
    expect(
      titleFromUrlContext(
        "[駅のポスター](https://example.com/poster)",
        "https://example.com/poster",
      ),
    ).toBe("駅のポスター");
    expect(
      titleFromUrlContext(
        "駅のポスター https://example.com/poster を見た",
        "https://example.com/poster",
      ),
    ).toBe("駅のポスター を見た");
    expect(
      titleFromUrlContext("https://www.example.com/path", "https://www.example.com/path"),
    ).toBe("example.com");
    expect(
      excerptAroundUrl("短いメモ https://example.com/x 続き", "https://example.com/x"),
    ).toContain("https://example.com/x");
  });
});

describe("idea URL → inspiration upsert", () => {
  afterEach(() => {
    setTestOgpFetch();
  });

  it("creates one inspiration per new URL on idea create and skips duplicates", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "ポスター https://example.com/idea-url-create を残す",
      }),
    });
    expect(create.status).toBe(201);

    const again = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "同じ https://example.com/idea-url-create は増やさない",
      }),
    });
    expect(again.status).toBe(201);

    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { url: string | null; title: string }[] };
    const matches = listed.items.filter(
      (item) => item.url === "https://example.com/idea-url-create",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.title).toContain("ポスター");
  });

  it("upserts a new URL when the idea body changes, not on stage-only PATCH", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "段階だけ https://example.com/idea-url-stage" }),
    });
    const created = (await create.json()) as { item: { id: number } };

    const staged = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: "aging" }),
    });
    expect(staged.status).toBe(200);

    const edited = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        body: "追加 https://example.com/idea-url-edit を棚へ",
      }),
    });
    expect(edited.status).toBe(200);

    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { url: string | null }[] };
    expect(listed.items.some((item) => item.url === "https://example.com/idea-url-stage")).toBe(
      true,
    );
    expect(listed.items.some((item) => item.url === "https://example.com/idea-url-edit")).toBe(
      true,
    );
  });

  it("upserts from the detail edit action when body changes", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "編集前" }),
    });
    const created = (await create.json()) as { item: { id: number } };
    const result = await ideaDetailAction(
      detailActionArgs(created.item.id, {
        intent: "edit",
        title: "編集後",
        body: "リンク https://example.com/idea-url-form",
        tags: "",
      }),
    );
    expect(result).toEqual({ ok: true, intent: "edit" });

    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { url: string | null; title: string }[] };
    expect(listed.items.some((item) => item.url === "https://example.com/idea-url-form")).toBe(
      true,
    );
  });

  it("does not block idea save when the shelf write throws", async () => {
    await expect(
      safeUpsertInspirationsFromIdeaText(
        {
          select: () => {
            throw new Error("db down");
          },
        } as never,
        "https://example.com/idea-url-fail",
      ),
    ).resolves.toBeUndefined();

    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "棚が落ちても残る https://example.com/idea-url-still-saves" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { title: string } };
    expect(created.item.title).toContain("棚が落ちても残る");
  });

  it("does not fetch OGP on idea-URL upsert, then 再取得 can fill the gallery cache", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "遅延プレビュー https://example.com/idea-url-ogp-later",
      }),
    });
    expect(create.status).toBe(201);

    const list = await api("/inspirations");
    const listed = (await list.json()) as {
      items: { id: number; url: string | null; ogStatus: string; ogTitle: string }[];
    };
    const row = listed.items.find((item) => item.url === "https://example.com/idea-url-ogp-later");
    expect(row?.ogStatus).toBe("none");
    expect(row?.ogTitle).toBe("");

    setTestOgpFetch(async () => ({
      status: "ok",
      title: "遅延で取れた",
      description: "",
      imageUrl: "https://cdn.example.com/later.jpg",
      siteName: "",
      fetchedAt: "2026-09-20 02:00:00",
    }));
    const refreshed = await api(`/inspirations/${row?.id}/ogp`, { method: "POST" });
    expect(refreshed.status).toBe(200);
    const body = (await refreshed.json()) as { item: { ogTitle: string; ogStatus: string } };
    expect(body.item.ogTitle).toBe("遅延で取れた");
    expect(body.item.ogStatus).toBe("ok");
  });
});
