import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Unscoped handle. Only for tenant resolution, billing and the webhook. */
export type RootDb = DrizzleD1Database<typeof schema>;

/**
 * Workspace-scoped handle. Every idea / inspiration / category / saved-view
 * query in db/ filters by `workspaceId`, so a route that holds a `Db` cannot
 * read another tenant's rows by accident. Build one with `createDb` once the
 * request's workspace is known (server/tenant/workspace.ts).
 */
export type Db = RootDb & { readonly workspaceId: number };

export function createRootDb(database: D1Database): RootDb {
  return drizzle(database, { schema });
}

export function scopeDb(root: RootDb, workspaceId: number): Db {
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    throw new Error("scopeDb: a positive workspaceId is required");
  }
  return Object.assign(root, { workspaceId }) as Db;
}

export function createDb(database: D1Database, workspaceId: number): Db {
  return scopeDb(createRootDb(database), workspaceId);
}
