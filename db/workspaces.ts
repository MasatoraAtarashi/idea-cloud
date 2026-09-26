import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { RootDb } from "./client";
import {
  categories,
  workspaceApiKeys,
  workspaceInvites,
  workspaceMembers,
  workspaces,
  type Workspace,
  type WorkspaceApiKey,
  type WorkspaceInvite,
  type WorkspaceMember,
  type WorkspaceRole,
} from "./schema";

export type { Workspace, WorkspaceApiKey, WorkspaceInvite, WorkspaceMember, WorkspaceRole };

export const WORKSPACE_NAME_MAX = 60;
export const WORKSPACE_MEMBER_MAX = 50;
export const WORKSPACE_API_KEY_MAX = 10;
export const INVITE_TTL_DAYS = 7;
export const INVITE_MAX_USES = 10;
/** Every new workspace starts with the same coarse buckets migration 0010 seeded. */
export const DEFAULT_CATEGORY_NAMES = ["執筆アイデア", "事業アイデア", "組織改善"] as const;

export const API_KEY_PREFIX = "icw_";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeWorkspaceName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, WORKSPACE_NAME_MAX);
}

/** Default name for a workspace made on first sign-in. */
export function personalWorkspaceName(email: string): string {
  const local = normalizeEmail(email).split("@")[0] ?? "";
  return normalizeWorkspaceName(local ? `${local} のワークスペース` : "マイワークスペース");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 24): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type Membership = {
  workspaceId: number;
  name: string;
  role: WorkspaceRole;
};

function asRole(value: string): WorkspaceRole {
  return value === "owner" ? "owner" : "member";
}

export async function getWorkspace(db: RootDb, id: number): Promise<Workspace | undefined> {
  const [row] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return row;
}

export async function listMembershipsForEmail(db: RootDb, email: string): Promise<Membership[]> {
  const rows = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      name: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.email, normalizeEmail(email)))
    .orderBy(asc(workspaceMembers.workspaceId));
  return rows.map((row) => ({ ...row, role: asRole(row.role) }));
}

export async function getMembership(
  db: RootDb,
  workspaceId: number,
  email: string,
): Promise<WorkspaceMember | undefined> {
  const [row] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.email, normalizeEmail(email)),
      ),
    )
    .limit(1);
  return row;
}

export async function listMembers(db: RootDb, workspaceId: number): Promise<WorkspaceMember[]> {
  return db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(workspaceMembers.id));
}

export async function countMembers(db: RootDb, workspaceId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  return Number(row?.count ?? 0);
}

/** Idempotent: an existing membership is returned as-is (role unchanged). */
export async function addMember(
  db: RootDb,
  workspaceId: number,
  email: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  const existing = await getMembership(db, workspaceId, email);
  if (existing) return existing;
  const [created] = await db
    .insert(workspaceMembers)
    .values({ workspaceId, email: normalizeEmail(email), role })
    .returning();
  if (!created) throw new Error("Failed to insert member");
  return created;
}

/** The last owner cannot be removed; returns false in that case or when absent. */
export async function removeMember(
  db: RootDb,
  workspaceId: number,
  email: string,
): Promise<boolean> {
  const target = await getMembership(db, workspaceId, email);
  if (!target) return false;
  if (target.role === "owner") {
    const owners = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, "owner")),
      );
    if (owners.length <= 1) return false;
  }
  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, target.id));
  return true;
}

export async function createWorkspace(
  db: RootDb,
  data: { name: string; ownerEmail: string },
): Promise<Workspace> {
  const name = normalizeWorkspaceName(data.name) || personalWorkspaceName(data.ownerEmail);
  const [created] = await db
    .insert(workspaces)
    .values({ name, createdBy: normalizeEmail(data.ownerEmail) })
    .returning();
  if (!created) throw new Error("Failed to insert workspace");
  await addMember(db, created.id, data.ownerEmail, "owner");
  await db.insert(categories).values(
    DEFAULT_CATEGORY_NAMES.map((categoryName, sortOrder) => ({
      workspaceId: created.id,
      name: categoryName,
      sortOrder,
    })),
  );
  return created;
}

export async function renameWorkspace(
  db: RootDb,
  workspaceId: number,
  rawName: string,
): Promise<Workspace | undefined> {
  const name = normalizeWorkspaceName(rawName);
  if (!name) return undefined;
  const [updated] = await db
    .update(workspaces)
    .set({ name })
    .where(eq(workspaces.id, workspaceId))
    .returning();
  return updated;
}

// ---------------------------------------------------------------------------
// Invite links
// ---------------------------------------------------------------------------

export type InviteStatus = "ok" | "expired" | "revoked" | "exhausted" | "missing";

function inviteStatus(row: WorkspaceInvite | undefined, now: Date): InviteStatus {
  if (!row) return "missing";
  if (row.revokedAt) return "revoked";
  if (Date.parse(row.expiresAt) <= now.getTime()) return "expired";
  if (row.uses >= row.maxUses) return "exhausted";
  return "ok";
}

export async function createInvite(
  db: RootDb,
  data: { workspaceId: number; createdBy: string; role?: WorkspaceRole },
  now = new Date(),
): Promise<{ token: string; invite: WorkspaceInvite }> {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString();
  const [invite] = await db
    .insert(workspaceInvites)
    .values({
      workspaceId: data.workspaceId,
      tokenHash: await sha256Hex(token),
      role: data.role ?? "member",
      createdBy: normalizeEmail(data.createdBy),
      expiresAt,
      maxUses: INVITE_MAX_USES,
    })
    .returning();
  if (!invite) throw new Error("Failed to insert invite");
  return { token, invite };
}

export async function listActiveInvites(
  db: RootDb,
  workspaceId: number,
  now = new Date(),
): Promise<WorkspaceInvite[]> {
  const rows = await db
    .select()
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.workspaceId, workspaceId), isNull(workspaceInvites.revokedAt)))
    .orderBy(asc(workspaceInvites.id));
  return rows.filter((row) => inviteStatus(row, now) === "ok");
}

export async function revokeInvite(db: RootDb, workspaceId: number, id: number): Promise<boolean> {
  const [updated] = await db
    .update(workspaceInvites)
    .set({ revokedAt: sql`(datetime('now'))` })
    .where(and(eq(workspaceInvites.id, id), eq(workspaceInvites.workspaceId, workspaceId)))
    .returning();
  return Boolean(updated);
}

export async function lookupInvite(
  db: RootDb,
  token: string,
  now = new Date(),
): Promise<{ status: InviteStatus; invite?: WorkspaceInvite; workspace?: Workspace }> {
  if (!/^[0-9a-f]{48}$/.test(token)) return { status: "missing" };
  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.tokenHash, await sha256Hex(token)))
    .limit(1);
  const status = inviteStatus(invite, now);
  if (status !== "ok" || !invite) return { status, invite };
  const workspace = await getWorkspace(db, invite.workspaceId);
  return workspace ? { status, invite, workspace } : { status: "missing" };
}

/** Consumes one use and adds the member. Already-members do not spend a use. */
export async function acceptInvite(
  db: RootDb,
  token: string,
  email: string,
  now = new Date(),
): Promise<{ status: InviteStatus; workspaceId?: number }> {
  const found = await lookupInvite(db, token, now);
  if (found.status !== "ok" || !found.invite) return { status: found.status };
  const invite = found.invite;
  if (await getMembership(db, invite.workspaceId, email)) {
    return { status: "ok", workspaceId: invite.workspaceId };
  }
  if ((await countMembers(db, invite.workspaceId)) >= WORKSPACE_MEMBER_MAX) {
    return { status: "exhausted" };
  }
  await addMember(db, invite.workspaceId, email, asRole(invite.role));
  await db
    .update(workspaceInvites)
    .set({ uses: sql`${workspaceInvites.uses} + 1` })
    .where(eq(workspaceInvites.id, invite.id));
  return { status: "ok", workspaceId: invite.workspaceId };
}

// ---------------------------------------------------------------------------
// API keys (/mcp bearer)
// ---------------------------------------------------------------------------

export function looksLikeWorkspaceApiKey(value: string): boolean {
  return value.startsWith(API_KEY_PREFIX) && value.length > API_KEY_PREFIX.length + 16;
}

export async function createApiKey(
  db: RootDb,
  data: { workspaceId: number; name: string; createdBy: string },
): Promise<{ key: string; row: WorkspaceApiKey }> {
  const key = `${API_KEY_PREFIX}${randomToken(24)}`;
  const [row] = await db
    .insert(workspaceApiKeys)
    .values({
      workspaceId: data.workspaceId,
      name: data.name.replace(/\s+/g, " ").trim().slice(0, 60) || "MCP",
      tokenHash: await sha256Hex(key),
      prefix: key.slice(0, API_KEY_PREFIX.length + 6),
      createdBy: normalizeEmail(data.createdBy),
    })
    .returning();
  if (!row) throw new Error("Failed to insert api key");
  return { key, row };
}

export async function listApiKeys(db: RootDb, workspaceId: number): Promise<WorkspaceApiKey[]> {
  return db
    .select()
    .from(workspaceApiKeys)
    .where(and(eq(workspaceApiKeys.workspaceId, workspaceId), isNull(workspaceApiKeys.revokedAt)))
    .orderBy(asc(workspaceApiKeys.id));
}

export async function revokeApiKey(db: RootDb, workspaceId: number, id: number): Promise<boolean> {
  const [updated] = await db
    .update(workspaceApiKeys)
    .set({ revokedAt: sql`(datetime('now'))` })
    .where(and(eq(workspaceApiKeys.id, id), eq(workspaceApiKeys.workspaceId, workspaceId)))
    .returning();
  return Boolean(updated);
}

/** Resolves a presented key to its workspace and stamps last_used_at. */
export async function resolveApiKey(
  db: RootDb,
  presented: string,
): Promise<{ workspaceId: number; keyId: number } | null> {
  if (!looksLikeWorkspaceApiKey(presented)) return null;
  const [row] = await db
    .select()
    .from(workspaceApiKeys)
    .where(eq(workspaceApiKeys.tokenHash, await sha256Hex(presented)))
    .limit(1);
  if (!row || row.revokedAt) return null;
  await db
    .update(workspaceApiKeys)
    .set({ lastUsedAt: sql`(datetime('now'))` })
    .where(eq(workspaceApiKeys.id, row.id));
  return { workspaceId: row.workspaceId, keyId: row.id };
}
