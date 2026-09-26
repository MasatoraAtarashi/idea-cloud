import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createDb, createRootDb } from "../db/client";
import { getIdeaRow, insertIdea, listIdeaRows } from "../db/ideas";
import { listCategories } from "../db/categories";
import { getInspirationRow, insertInspiration } from "../db/inspirations";
import {
  acceptInvite,
  createApiKey,
  createInvite,
  createWorkspace,
  getMembership,
  listMembershipsForEmail,
  lookupInvite,
  removeMember,
  resolveApiKey,
  revokeApiKey,
} from "../db/workspaces";
import { authorizeMcpRequest } from "../server/mcp/auth";
import {
  LEGACY_WORKSPACE_ID,
  readWorkspaceCookie,
  resolveWorkspace,
} from "../server/tenant/workspace";
import {
  authHeaders,
  sessionCookie,
  testEnv,
  TEST_USER_EMAIL,
  TEST_WORKSPACE_ID,
} from "./auth-helper";

function root() {
  return createRootDb(env.DB);
}

function unique(label: string) {
  return `${label}-${crypto.randomUUID()}`;
}

async function api(path: string, init?: RequestInit, cookie?: string) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: {
      ...(cookie ? { cookie } : await authHeaders()),
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

describe("workspace scoping in db/", () => {
  it("keeps ideas, inspirations and categories of another workspace invisible", async () => {
    const other = await createWorkspace(root(), {
      name: unique("other"),
      ownerEmail: "other-owner@example.com",
    });
    const mine = createDb(env.DB, TEST_WORKSPACE_ID);
    const theirs = createDb(env.DB, other.id);

    const secret = await insertIdea(theirs, unique("他社の秘密"));
    const shelf = await insertInspiration(theirs, { title: unique("他社の棚"), memo: "x" });

    expect(await getIdeaRow(mine, secret.id)).toBeUndefined();
    expect(await getInspirationRow(mine, shelf.id)).toBeUndefined();
    expect((await listIdeaRows(mine)).some((row) => row.id === secret.id)).toBe(false);
    expect((await listIdeaRows(theirs)).some((row) => row.id === secret.id)).toBe(true);

    const theirCategories = await listCategories(theirs);
    expect(theirCategories.map((row) => row.name)).toContain("執筆アイデア");
    expect(theirCategories.every((row) => row.workspaceId === other.id)).toBe(true);
    expect((await listCategories(mine)).every((row) => row.workspaceId === TEST_WORKSPACE_ID)).toBe(
      true,
    );
  });

  it("returns 404 from /api for an idea that belongs to another workspace", async () => {
    const other = await createWorkspace(root(), {
      name: unique("api-other"),
      ownerEmail: "api-other@example.com",
    });
    const secret = await insertIdea(createDb(env.DB, other.id), unique("見えないはず"));
    expect((await api(`/ideas/${secret.id}`)).status).toBe(404);
    expect((await api(`/ideas/${secret.id}/comments`)).status).toBe(404);
    const patched = await api(`/ideas/${secret.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: "aging" }),
    });
    expect(patched.status).toBe(404);
    expect((await api(`/ideas/${secret.id}`, { method: "DELETE" })).status).toBe(404);
    const list = (await (await api("/ideas")).json()) as { items: { id: number }[] };
    expect(list.items.some((item) => item.id === secret.id)).toBe(false);
  });

  it("refuses to attach a comment to an idea outside the workspace", async () => {
    const other = await createWorkspace(root(), {
      name: unique("comment-other"),
      ownerEmail: "comment-other@example.com",
    });
    const secret = await insertIdea(createDb(env.DB, other.id), unique("コメント不可"));
    const res = await api(`/ideas/${secret.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "侵入" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("workspace resolution", () => {
  it("allowlisted test identities land in the legacy workspace", async () => {
    const current = await resolveWorkspace(root(), TEST_USER_EMAIL, testEnv, null);
    expect(current.id).toBe(LEGACY_WORKSPACE_ID);
    expect(current.role).toBe("owner");
  });

  it("gives a stranger a personal workspace, never the legacy one", async () => {
    const stranger = unique("stranger") + "@example.com";
    const openEnv = { ...testEnv, ACCESS_ALLOWED_EMAILS: "" } as Env;
    const current = await resolveWorkspace(root(), stranger, openEnv, null);
    expect(current.id).not.toBe(LEGACY_WORKSPACE_ID);
    expect(current.role).toBe("owner");
    expect(current.name).toContain("のワークスペース");
    // A forged cookie pointing at the legacy workspace is ignored.
    const forged = await resolveWorkspace(root(), stranger, openEnv, LEGACY_WORKSPACE_ID);
    expect(forged.id).toBe(current.id);
  });

  it("honours the ic_ws cookie only for a workspace the user belongs to", async () => {
    const second = await createWorkspace(root(), {
      name: unique("second"),
      ownerEmail: TEST_USER_EMAIL,
    });
    const picked = await resolveWorkspace(root(), TEST_USER_EMAIL, testEnv, second.id);
    expect(picked.id).toBe(second.id);
    const fallback = await resolveWorkspace(root(), TEST_USER_EMAIL, testEnv, 999_999);
    expect(fallback.id).toBe(LEGACY_WORKSPACE_ID);
    expect(readWorkspaceCookie(`ic_session=abc; ic_ws=${second.id}`)).toBe(second.id);
    expect(readWorkspaceCookie("ic_ws=abc")).toBeNull();
    expect(readWorkspaceCookie(null)).toBeNull();

    // The API follows the same cookie, so a switched session lists that workspace.
    const idea = await insertIdea(createDb(env.DB, second.id), unique("二つ目"));
    const cookie = `${await sessionCookie()}; ic_ws=${second.id}`;
    const one = await api(`/ideas/${idea.id}`, undefined, cookie);
    expect(one.status).toBe(200);
    const fromLegacy = await api(`/ideas/${idea.id}`);
    expect(fromLegacy.status).toBe(404);
  });
});

describe("invites", () => {
  it("adds a member through a hashed one-week link and counts uses", async () => {
    const owner = unique("owner") + "@example.com";
    const ws = await createWorkspace(root(), { name: unique("team"), ownerEmail: owner });
    const { token, invite } = await createInvite(root(), { workspaceId: ws.id, createdBy: owner });
    expect(invite.tokenHash).not.toContain(token);
    expect((await lookupInvite(root(), token)).status).toBe("ok");
    expect((await lookupInvite(root(), "nope")).status).toBe("missing");

    const joiner = unique("joiner") + "@example.com";
    const accepted = await acceptInvite(root(), token, joiner);
    expect(accepted).toEqual({ status: "ok", workspaceId: ws.id });
    expect((await getMembership(root(), ws.id, joiner))?.role).toBe("member");
    expect((await listMembershipsForEmail(root(), joiner)).map((m) => m.workspaceId)).toEqual([
      ws.id,
    ]);

    // Re-accepting does not spend another use.
    await acceptInvite(root(), token, joiner);
    const again = await lookupInvite(root(), token);
    expect(again.invite?.uses).toBe(1);

    const expired = await acceptInvite(root(), token, "late@example.com", new Date("2999-01-01"));
    expect(expired.status).toBe("expired");
  });

  it("never removes the last owner", async () => {
    const owner = unique("solo") + "@example.com";
    const ws = await createWorkspace(root(), { name: unique("solo"), ownerEmail: owner });
    expect(await removeMember(root(), ws.id, owner)).toBe(false);
  });
});

describe("workspace API keys on /mcp", () => {
  it("opens exactly the key's workspace and stops after revocation", async () => {
    const owner = unique("mcp-owner") + "@example.com";
    const ws = await createWorkspace(root(), { name: unique("mcp"), ownerEmail: owner });
    const { key, row } = await createApiKey(root(), {
      workspaceId: ws.id,
      name: "Cursor",
      createdBy: owner,
    });
    expect(key.startsWith("icw_")).toBe(true);
    expect(row.tokenHash).not.toContain(key.slice(4));

    const authorized = await authorizeMcpRequest(
      new Request("https://example.com/mcp", { headers: { authorization: `Bearer ${key}` } }),
      testEnv,
    );
    expect(authorized).toEqual({ workspaceId: ws.id, via: "workspace_key" });
    expect(await resolveApiKey(root(), key.slice(0, -1) + "0")).toBeNull();

    const hidden = await insertIdea(createDb(env.DB, TEST_WORKSPACE_ID), unique("legacy-only"));
    const listed = await exports.default.fetch("https://example.com/mcp", {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_idea", arguments: { id: hidden.id } },
      }),
    });
    expect(listed.status).toBe(200);
    expect(await listed.text()).not.toContain("legacy-only");

    expect(await revokeApiKey(root(), ws.id, row.id)).toBe(true);
    const denied = await authorizeMcpRequest(
      new Request("https://example.com/mcp", { headers: { authorization: `Bearer ${key}` } }),
      testEnv,
    );
    expect((denied as Response).status).toBe(401);
  });
});
