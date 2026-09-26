import type { AppLoadContext } from "react-router";
import { createDb, type Db } from "../../db/client";

/**
 * Workspace-scoped D1 handle for loaders and actions under /app. The page gate
 * has already resolved the workspace; a missing one here is a programming
 * error (a public route reaching for tenant data), so it throws.
 */
export function appDb(context: AppLoadContext): Db {
  const workspace = context.workspace;
  if (!workspace) throw new Error("appDb: no workspace on this request");
  return createDb(context.cloudflare.env.DB, workspace.id);
}
