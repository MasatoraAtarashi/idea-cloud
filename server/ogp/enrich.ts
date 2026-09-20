import type { Db } from "../../db/client";
import { updateInspirationOgp, type Inspiration } from "../../db/inspirations";
import { fetchOpenGraph, openGraphFields } from "./fetch";

/** Fetch OGP for a row. Never throws — failed fetch is stored as og_status=failed. */
export async function enrichInspirationOgp(
  db: Db,
  row: Pick<Inspiration, "id" | "url">,
): Promise<Inspiration> {
  const result = await fetchOpenGraph(row.url);
  const updated = await updateInspirationOgp(db, row.id, openGraphFields(result));
  return updated ?? (row as Inspiration);
}
