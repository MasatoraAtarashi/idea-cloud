import { afterEach, describe, expect, it } from "vitest";
import { exports } from "cloudflare:workers";
import { summarizeIdeaAnalytics } from "../app/lib/analytics";
import { parseListViewSearch, serializeListViewSearch } from "../app/lib/list-view-search";
import { hasReflection, parseReflectionStatus } from "../app/lib/reflection";
import { parseReviewStatus } from "../app/lib/review";
import { isReviewCandidate, isTriedIdea, type MockIdea } from "../app/data/mock";
import { ideaTextFromInspiration } from "../db/inspirations";
import { setTestAiRun } from "../server/ai/research";
import { setTestOgpFetch } from "../server/ogp/fetch";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

function sample(partial: Partial<MockIdea> = {}): MockIdea {
  return {
    id: "1",
    title: "棚の種",
    body: "本文",
    stage: "spark",
    tags: [],
    author: "",
    team: "",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    agedDays: 18,
    relatedIds: [],
    commentCount: 0,
    reviewStatus: "none",
    reflectionStatus: "none",
    reflectionOutcome: "",
    reflectionNotes: "",
    ...partial,
  };
}

describe("review and reflection parsers", () => {
  it("accepts known review statuses and falls back to none", () => {
    expect(parseReviewStatus("hold")).toBe("hold");
    expect(parseReviewStatus("reviewed")).toBe("reviewed");
    expect(parseReviewStatus("nope")).toBe("none");
  });

  it("accepts known reflection statuses", () => {
    expect(parseReflectionStatus("tried")).toBe("tried");
    expect(parseReflectionStatus("dropped")).toBe("dropped");
    expect(parseReflectionStatus("")).toBe("none");
  });

  it("treats outcome or notes as a reflection even when status is none", () => {
    expect(hasReflection(sample())).toBe(false);
    expect(hasReflection(sample({ reflectionOutcome: "やってみた" }))).toBe(true);
    expect(hasReflection(sample({ reflectionStatus: "tried" }))).toBe(true);
  });
});

describe("shelf list helpers", () => {
  it("keeps archived ideas out of 熟成候補 and uses last review as the clock", () => {
    const now = Date.parse("2026-09-19T00:00:00Z");
    expect(isReviewCandidate(sample({ stage: "archived" }), 7, now)).toBe(false);
    expect(
      isReviewCandidate(sample({ createdAt: "2026-09-18T00:00:00Z", agedDays: 1 }), 7, now),
    ).toBe(false);
    expect(isReviewCandidate(sample({ createdAt: "2026-09-01T00:00:00Z" }), 7, now)).toBe(true);
    expect(
      isReviewCandidate(
        sample({ createdAt: "2026-09-01T00:00:00Z", lastReviewedAt: "2026-09-18T00:00:00Z" }),
        7,
        now,
      ),
    ).toBe(false);
  });

  it("treats 採用 or any reflection as 試したアイデア", () => {
    expect(isTriedIdea(sample({ stage: "selected" }))).toBe(true);
    expect(isTriedIdea(sample({ reflectionStatus: "hold" }))).toBe(true);
    expect(isTriedIdea(sample({ stage: "spark" }))).toBe(false);
  });

  it("defaults 熟成候補 tab to 7 days in the URL", () => {
    const parsed = parseListViewSearch(new URLSearchParams("tab=candidates"));
    expect(parsed.tab).toBe("candidates");
    expect(parsed.minDays).toBe(7);
    expect(serializeListViewSearch(parsed).get("tab")).toBe("candidates");
    expect(serializeListViewSearch(parsed).get("days")).toBe("7");
    expect(parseListViewSearch(new URLSearchParams("tab=tried")).tab).toBe("tried");
  });
});

describe("idea analytics summary", () => {
  it("counts stages, scores, reflections, and tag frequency", () => {
    const summary = summarizeIdeaAnalytics([
      sample({
        id: "1",
        stage: "spark",
        agedDays: 2,
        tags: ["朝", "音声"],
        humanScore: 4,
      }),
      sample({
        id: "2",
        stage: "selected",
        agedDays: 10,
        tags: ["朝"],
        aiScore: 3,
        reflectionStatus: "tried",
        reflectionOutcome: "使った",
      }),
    ]);
    expect(summary.total).toBe(2);
    expect(summary.byStage.find((row) => row.stage === "spark")?.count).toBe(1);
    expect(summary.byStage.find((row) => row.stage === "selected")?.count).toBe(1);
    expect(summary.averageAgedDays).toBe(6);
    expect(summary.medianAgedDays).toBe(6);
    expect(summary.withHumanScore).toBe(1);
    expect(summary.withAiScore).toBe(1);
    expect(summary.withReflection).toBe(1);
    expect(summary.topTags[0]).toEqual({ tag: "朝", count: 2 });
  });

  it("returns empty totals for an empty workspace", () => {
    const summary = summarizeIdeaAnalytics([]);
    expect(summary.total).toBe(0);
    expect(summary.averageAgedDays).toBeNull();
    expect(summary.medianAgedDays).toBeNull();
    expect(summary.topTags).toEqual([]);
  });
});

describe("inspiration seed text", () => {
  it("joins title, url, and memo for brainstorm context", () => {
    const text = ideaTextFromInspiration({
      title: "駅のポスター",
      url: "https://example.com/poster",
      memo: "色が残る",
    });
    expect(text).toContain("駅のポスター");
    expect(text).toContain("URL: https://example.com/poster");
    expect(text).toContain("色が残る");
  });

  it("includes og:title when it differs from the saved title", () => {
    const text = ideaTextFromInspiration({
      title: "無題",
      url: "https://example.com/poster",
      memo: "",
      ogTitle: "駅のポスター",
    });
    expect(text).toContain("ページ: 駅のポスター");
  });
});

describe("review and reflection API", () => {
  it("saves review status and reflection fields on PATCH", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "見直し対象" }),
    });
    const created = (await create.json()) as { item: { id: number } };

    const reviewed = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reviewStatus: "hold" }),
    });
    expect(reviewed.status).toBe(200);
    const reviewBody = (await reviewed.json()) as {
      item: { reviewStatus: string; lastReviewedAt: string };
    };
    expect(reviewBody.item.reviewStatus).toBe("hold");
    expect(reviewBody.item.lastReviewedAt).toBeTruthy();

    const reflected = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        reflectionStatus: "tried",
        reflectionOutcome: "やってみた結果",
        reflectionNotes: "短く残す",
      }),
    });
    expect(reflected.status).toBe(200);
    const reflectionBody = (await reflected.json()) as {
      item: { reflectionStatus: string; reflectionOutcome: string; reflectionNotes: string };
    };
    expect(reflectionBody.item.reflectionStatus).toBe("tried");
    expect(reflectionBody.item.reflectionOutcome).toBe("やってみた結果");
    expect(reflectionBody.item.reflectionNotes).toBe("短く残す");
  });
});

describe("inspirations API", () => {
  afterEach(() => {
    setTestAiRun();
    setTestOgpFetch();
  });

  it("creates, lists, updates, and brainstorms from a memo", async () => {
    setTestOgpFetch(async () => ({
      status: "ok",
      title: "駅の光",
      description: "夜のホーム",
      imageUrl: "https://cdn.example.com/poster.jpg",
      siteName: "Example",
      fetchedAt: "2026-09-20 00:00:00",
    }));
    const create = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({
        title: "駅のポスター",
        url: "https://example.com/poster",
        memo: "色が残る",
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      item: {
        id: number;
        title: string;
        url: string;
        ogTitle: string;
        ogImageUrl: string;
        ogStatus: string;
      };
    };
    expect(created.item.title).toBe("駅のポスター");
    expect(created.item.url).toBe("https://example.com/poster");
    expect(created.item.ogTitle).toBe("駅の光");
    expect(created.item.ogImageUrl).toBe("https://cdn.example.com/poster.jpg");
    expect(created.item.ogStatus).toBe("ok");

    const list = await api("/inspirations");
    const listed = (await list.json()) as { items: { title: string }[] };
    expect(listed.items.some((item) => item.title === "駅のポスター")).toBe(true);

    const patched = await api(`/inspirations/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ memo: "色と音が残る" }),
    });
    expect(patched.status).toBe(200);

    setTestAiRun(async () => ({
      response: "切り口:\n- 角度\n別案:\n- 変種\n次の問い:\n- 質問\n関連する方向:\n- 棚",
    }));
    const brainstorm = await api(`/inspirations/${created.item.id}/brainstorm`, { method: "POST" });
    expect(brainstorm.status).toBe(200);
    const body = (await brainstorm.json()) as { item: { id: number; title: string } };
    expect(body.item.title).toBe("駅のポスター");

    const idea = await api(`/ideas/${body.item.id}`);
    expect(idea.status).toBe(200);
  });

  it("rejects an empty inspiration", async () => {
    const res = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("入力してください");
    expect(body.error).not.toMatch(/貼って/);
  });

  it("saves a trimmed http URL with no title", async () => {
    const sample = "http://www.sc-runner.com/2013/10/kinovea-tutorial.html";
    setTestOgpFetch(async () => {
      throw new Error("network");
    });
    const create = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({ title: "", url: `\n${sample} \u200B\n` }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      item: { title: string; url: string; ogStatus: string };
    };
    expect(created.item.url).toBe(sample);
    expect(created.item.title).toBe("kinovea tutorial");
    expect(created.item.ogStatus).toBe("failed");
  });

  it("uses the page title for a URL-only create when Open Graph succeeds", async () => {
    setTestOgpFetch(async () => ({
      status: "ok",
      title: "Kinovea チュートリアル",
      description: "解説",
      imageUrl: "",
      siteName: "SC Runner",
      fetchedAt: "2026-09-24 00:00:00",
    }));
    const create = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({
        url: "www.sc-runner.com/2013/10/kinovea-tutorial.html",
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { title: string; url: string } };
    expect(created.item.url).toBe("https://www.sc-runner.com/2013/10/kinovea-tutorial.html");
    expect(created.item.title).toBe("Kinovea チュートリアル");
  });

  it("describes a bad URL instead of asking for a paste", async () => {
    const res = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({ url: "これはURLではない", title: "" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("URLの形式が正しくありません");
    expect(body.error).not.toMatch(/貼って|タイトル/);
  });

  it("stores og_status=failed when fetch fails and still saves the row", async () => {
    setTestOgpFetch(async () => {
      throw new Error("network");
    });
    const create = await api("/inspirations", {
      method: "POST",
      body: JSON.stringify({
        title: "取れないページ",
        url: "https://example.com/missing",
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { id: number; ogStatus: string } };
    expect(created.item.ogStatus).toBe("failed");

    setTestOgpFetch(async () => ({
      status: "ok",
      title: "再取得できた",
      description: "",
      imageUrl: "https://cdn.example.com/ok.jpg",
      siteName: "",
      fetchedAt: "2026-09-20 01:00:00",
    }));
    const refreshed = await api(`/inspirations/${created.item.id}/ogp`, { method: "POST" });
    expect(refreshed.status).toBe(200);
    const body = (await refreshed.json()) as { item: { ogTitle: string; ogStatus: string } };
    expect(body.item.ogTitle).toBe("再取得できた");
    expect(body.item.ogStatus).toBe("ok");
  });
});
