import type { Context } from "hono";
import { createDb, type Db } from "../../db/client";
import type { AppEnv } from "../env";

/** Workspace-scoped D1 handle for `/api` handlers. sessionAuth sets `workspace`. */
export function apiDb(c: Context<AppEnv>): Db {
  return createDb(c.env.DB, c.get("workspace").id);
}
