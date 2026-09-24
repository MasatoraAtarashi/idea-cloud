import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import {
  commentComposerAfterSettle,
  commentComposerResetOnSubmit,
} from "../app/lib/comment-composer";
import { COMMENT_BODY_MAX } from "../db/comments";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

async function createIdea(body: string) {
  const create = await api("/ideas", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  const created = (await create.json()) as { item: { id: number } };
  return created.item.id;
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

describe("idea comments API", () => {
  it("creates comments in chronological order and counts them on the idea", async () => {
    const id = await createIdea("コメントを残す");

    const first = await api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "朝の観点" }),
    });
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as {
      item: { body: string; authorId: string; authorName: string; createdAt: string };
    };
    expect(firstBody.item.body).toBe("朝の観点");
    expect(firstBody.item.authorId).toBe("test@example.com");
    expect(firstBody.item.authorName).toBe("test@example.com");
    expect(firstBody.item.createdAt).toBeTruthy();

    const second = await api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "夜に見返す" }),
    });
    expect(second.status).toBe(201);

    const list = await api(`/ideas/${id}/comments`);
    expect(list.status).toBe(200);
    const listed = (await list.json()) as { items: { body: string }[] };
    expect(listed.items.map((item) => item.body)).toEqual(["朝の観点", "夜に見返す"]);

    const one = await api(`/ideas/${id}`);
    const detail = (await one.json()) as {
      item: { commentCount: number; updatedAt: string; createdAt: string };
    };
    expect(detail.item.commentCount).toBe(2);
    expect(detail.item.updatedAt).toBeTruthy();
  });

  it("returns 404 when commenting on a missing idea", async () => {
    const res = await api("/ideas/999999/comments", {
      method: "POST",
      body: JSON.stringify({ body: "ない" }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects empty and too-long comments", async () => {
    const id = await createIdea("検証");
    const empty = await api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "   " }),
    });
    expect(empty.status).toBe(400);

    const tooLong = await api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "あ".repeat(COMMENT_BODY_MAX + 1) }),
    });
    expect(tooLong.status).toBe(400);
  });
});

describe("idea detail comment action", () => {
  it("persists a comment from the detail form without a document redirect", async () => {
    const id = await createIdea("詳細からコメント");
    const result = await ideaDetailAction(
      detailActionArgs(id, { intent: "comment", body: "寝かせてから見る" }),
    );
    expect(result).toEqual({ ok: true, intent: "comment" });

    const list = await api(`/ideas/${id}/comments`);
    const listed = (await list.json()) as {
      items: { body: string; authorId: string; authorName: string }[];
    };
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.body).toBe("寝かせてから見る");
    expect(listed.items[0]?.authorId).toBe("mock-user");
    expect(listed.items[0]?.authorName).toBe("ログイン中");
  });

  it("returns a Japanese error when the comment is empty", async () => {
    const id = await createIdea("空コメント");
    const result = await ideaDetailAction(detailActionArgs(id, { intent: "comment", body: "  " }));
    expect(result).toEqual({ error: "入力してください", intent: "comment" });
  });
});

describe("comment composer reset", () => {
  it("clears the input after FormData is captured and stays empty on success", () => {
    const draft = commentComposerResetOnSubmit(
      { body: "朝の観点", formKey: 0, lastSubmitted: "" },
      "朝の観点",
    );
    expect(draft.body).toBe("");
    expect(draft.formKey).toBe(1);
    expect(draft.lastSubmitted).toBe("朝の観点");

    const settled = commentComposerAfterSettle(draft, { ok: true });
    expect(settled.body).toBe("");
    expect(settled.formKey).toBe(1);
  });

  it("restores the draft when comment create fails", () => {
    const draft = commentComposerResetOnSubmit(
      { body: "長すぎる下書き", formKey: 2, lastSubmitted: "" },
      "長すぎる下書き",
    );
    const settled = commentComposerAfterSettle(draft, { error: "長すぎます" });
    expect(settled.body).toBe("長すぎる下書き");
    expect(settled.formKey).toBe(3);
  });
});
