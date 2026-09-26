/**
 * Turns a signed-in email into the workspace this request acts in.
 *
 * A session cookie only proves identity. Membership lives in
 * `workspace_members`, and the preferred workspace (when the user has several)
 * is the plain `ic_ws` cookie — it is a hint, never a credential: membership is
 * re-checked on every request. See docs/spec/workspaces.md.
 */
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import type { RootDb } from "../../db/client";
import {
  addMember,
  countMembers,
  createWorkspace,
  getWorkspace,
  listMembershipsForEmail,
  type Membership,
  type WorkspaceRole,
} from "../../db/workspaces";
import { isLocalRequest } from "../auth/session";
import type { AppEnv } from "../env";
import { parseAllowlist } from "../security/allowlist";

export const WORKSPACE_COOKIE = "ic_ws";
/** Row inserted by migration 0013 that holds every pre-tenancy idea. */
export const LEGACY_WORKSPACE_ID = 1;

export type CurrentWorkspace = {
  id: number;
  name: string;
  role: WorkspaceRole;
};

export function readWorkspaceCookie(cookieHeader: string | null | undefined): number | null {
  if (!cookieHeader) return null;
  const match = new RegExp(`(?:^|;\\s*)${WORKSPACE_COOKIE}=(\\d{1,12})(?:;|$)`).exec(cookieHeader);
  if (!match?.[1]) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function setWorkspaceCookie(c: Context<AppEnv>, workspaceId: number) {
  setCookie(c, WORKSPACE_COOKIE, String(workspaceId), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocalRequest(c.req.url),
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** `Set-Cookie` value for code paths that build a Response by hand. */
export function workspaceCookieHeader(workspaceId: number, requestUrl: string): string {
  const secure = isLocalRequest(requestUrl) ? "" : "; Secure";
  return `${WORKSPACE_COOKIE}=${workspaceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`;
}

/**
 * First sign-in with no membership anywhere. The legacy workspace is claimed by
 * the first person to arrive, or by anyone on ACCESS_ALLOWED_EMAILS (a closed
 * team that predates tenancy). Everyone else gets a personal workspace.
 */
async function bootstrapMembership(db: RootDb, email: string, env: Env): Promise<void> {
  const legacy = await getWorkspace(db, LEGACY_WORKSPACE_ID);
  if (legacy) {
    const allowlisted = parseAllowlist(env.ACCESS_ALLOWED_EMAILS).includes(
      email.trim().toLowerCase(),
    );
    const unclaimed = (await countMembers(db, LEGACY_WORKSPACE_ID)) === 0;
    if (allowlisted || unclaimed) {
      await addMember(db, LEGACY_WORKSPACE_ID, email, "owner");
      return;
    }
  }
  await createWorkspace(db, { name: "", ownerEmail: email });
}

function pick(memberships: Membership[], preferredId: number | null): CurrentWorkspace {
  const chosen =
    (preferredId != null
      ? memberships.find((membership) => membership.workspaceId === preferredId)
      : undefined) ?? memberships[0];
  if (!chosen) throw new Error("resolveWorkspace: no membership after bootstrap");
  return { id: chosen.workspaceId, name: chosen.name, role: chosen.role };
}

/** Never returns null for an allowed email: a workspace is created when needed. */
export async function resolveWorkspace(
  db: RootDb,
  email: string,
  env: Env,
  preferredId: number | null,
): Promise<CurrentWorkspace> {
  let memberships = await listMembershipsForEmail(db, email);
  if (memberships.length === 0) {
    await bootstrapMembership(db, email, env);
    memberships = await listMembershipsForEmail(db, email);
  }
  return pick(memberships, preferredId);
}
