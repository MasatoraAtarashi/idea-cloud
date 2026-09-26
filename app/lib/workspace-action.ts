import { redirect, type ActionFunctionArgs } from "react-router";
import { createRootDb } from "../../db/client";
import {
  WORKSPACE_API_KEY_MAX,
  WORKSPACE_NAME_MAX,
  countMembers,
  createApiKey,
  createInvite,
  createWorkspace,
  getMembership,
  listApiKeys,
  listMembershipsForEmail,
  normalizeEmail,
  removeMember,
  renameWorkspace,
  revokeApiKey,
  revokeInvite,
} from "../../db/workspaces";
import { workspaceCookieHeader } from "../../server/tenant/workspace";
import { LIST_PATH, SETTINGS_PATH } from "./home-path";

export type WorkspaceActionData = {
  intent: string;
  error?: string;
  ok?: true;
  /** Shown exactly once, right after `key-create`. Never stored in plaintext. */
  createdKey?: string;
  /** Absolute join URL, right after `invite-create`. */
  inviteUrl?: string;
};

export const JOIN_PATH_PREFIX = "/app/join/";

function fail(intent: string, error: string): WorkspaceActionData {
  return { intent, error };
}

function positiveInt(raw: unknown): number | null {
  const value = Number(String(raw ?? ""));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function withWorkspaceCookie(to: string, workspaceId: number, requestUrl: string): Response {
  return redirect(to, {
    headers: { "set-cookie": workspaceCookieHeader(workspaceId, requestUrl) },
  });
}

/**
 * 設定 → ワークスペース. Every write re-checks membership and role on the
 * server, so a stale or forged form cannot act on another tenant.
 */
export async function workspaceSettingsAction({
  request,
  context,
}: ActionFunctionArgs): Promise<Response | WorkspaceActionData> {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const email = context.userEmail;
  const current = context.workspace;
  if (!email || !current) return fail(intent, "ログインが必要です");
  const db = createRootDb(context.cloudflare.env.DB);
  const membership = await getMembership(db, current.id, email);
  if (!membership) return fail(intent, "このワークスペースのメンバーではありません");
  const isOwner = membership.role === "owner";

  switch (intent) {
    case "switch": {
      const target = positiveInt(form.get("workspaceId"));
      if (!target) return fail(intent, "見つかりません");
      if (!(await getMembership(db, target, email))) return fail(intent, "見つかりません");
      return withWorkspaceCookie(LIST_PATH, target, request.url);
    }
    case "create-workspace": {
      const name = String(form.get("name") ?? "").trim();
      if (!name) return fail(intent, "名前を入力してください");
      if (name.length > WORKSPACE_NAME_MAX) return fail(intent, "名前が長すぎます");
      if ((await listMembershipsForEmail(db, email)).length >= 20) {
        return fail(intent, "ワークスペースが多すぎます");
      }
      const created = await createWorkspace(db, { name, ownerEmail: email });
      return withWorkspaceCookie(SETTINGS_PATH, created.id, request.url);
    }
    case "rename": {
      if (!isOwner) return fail(intent, "管理者のみ変更できます");
      const name = String(form.get("name") ?? "").trim();
      if (!name) return fail(intent, "名前を入力してください");
      if (name.length > WORKSPACE_NAME_MAX) return fail(intent, "名前が長すぎます");
      await renameWorkspace(db, current.id, name);
      return { intent, ok: true };
    }
    case "invite-create": {
      if (!isOwner) return fail(intent, "管理者のみ招待できます");
      const role = form.get("role") === "owner" ? "owner" : "member";
      const { token } = await createInvite(db, { workspaceId: current.id, createdBy: email, role });
      const inviteUrl = new URL(`${JOIN_PATH_PREFIX}${token}`, new URL(request.url).origin);
      return { intent, ok: true, inviteUrl: inviteUrl.toString() };
    }
    case "invite-revoke": {
      if (!isOwner) return fail(intent, "管理者のみ操作できます");
      const id = positiveInt(form.get("inviteId"));
      if (!id || !(await revokeInvite(db, current.id, id))) return fail(intent, "見つかりません");
      return { intent, ok: true };
    }
    case "member-remove": {
      if (!isOwner) return fail(intent, "管理者のみ操作できます");
      const target = normalizeEmail(String(form.get("email") ?? ""));
      if (!target) return fail(intent, "見つかりません");
      if (target === normalizeEmail(email)) return fail(intent, "自分は「離脱」から抜けられます");
      if (!(await removeMember(db, current.id, target))) {
        return fail(intent, "最後の管理者は削除できません");
      }
      return { intent, ok: true };
    }
    case "leave": {
      if ((await countMembers(db, current.id)) <= 1) {
        return fail(intent, "最後のメンバーは離脱できません。別の管理者を追加してください。");
      }
      if (!(await removeMember(db, current.id, email))) {
        return fail(intent, "最後の管理者は離脱できません。別の管理者を追加してください。");
      }
      const remaining = await listMembershipsForEmail(db, email);
      const next = remaining[0]?.workspaceId;
      if (!next) {
        const created = await createWorkspace(db, { name: "", ownerEmail: email });
        return withWorkspaceCookie(LIST_PATH, created.id, request.url);
      }
      return withWorkspaceCookie(LIST_PATH, next, request.url);
    }
    case "key-create": {
      if (!isOwner) return fail(intent, "管理者のみ発行できます");
      if ((await listApiKeys(db, current.id)).length >= WORKSPACE_API_KEY_MAX) {
        return fail(intent, "キーが多すぎます。使っていないものを無効化してください。");
      }
      const name = String(form.get("name") ?? "").trim() || "MCP";
      const { key } = await createApiKey(db, { workspaceId: current.id, name, createdBy: email });
      return { intent, ok: true, createdKey: key };
    }
    case "key-revoke": {
      if (!isOwner) return fail(intent, "管理者のみ操作できます");
      const id = positiveInt(form.get("keyId"));
      if (!id || !(await revokeApiKey(db, current.id, id))) return fail(intent, "見つかりません");
      return { intent, ok: true };
    }
    default:
      return fail(intent, "不明な操作です");
  }
}
