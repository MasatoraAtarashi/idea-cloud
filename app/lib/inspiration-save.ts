import type { Db } from "../../db/client";
import {
  INSPIRATION_TITLE_MAX,
  insertInspiration,
  updateInspiration,
  type Inspiration,
} from "../../db/inspirations";
import { enrichInspirationOgp } from "../../server/ogp/enrich";
import {
  displayTitleForSave,
  isDerivedInspirationTitle,
  type PreparedInspiration,
} from "./inspiration-input";

/** Insert a shelf row and fill an empty title from Open Graph when the fetch works. */
export async function insertPreparedInspiration(
  db: Db,
  prepared: PreparedInspiration,
): Promise<Inspiration> {
  const created = await insertInspiration(db, {
    title: prepared.title,
    url: prepared.url,
    memo: prepared.memo,
    tags: prepared.tags,
  });
  if (!created.url) return created;
  return applyFetchedTitle(db, created, prepared.titleFromUser);
}

/** Fetch Open Graph. A failed fetch leaves the row saved with its fallback title. */
export async function applyFetchedTitle(
  db: Db,
  row: Inspiration,
  titleFromUser: boolean,
): Promise<Inspiration> {
  const enriched = await enrichInspirationOgp(db, row);
  if (titleFromUser || !enriched.url) return enriched;
  const og = enriched.ogTitle?.trim() ?? "";
  if (!og) return enriched;
  const title = og.slice(0, INSPIRATION_TITLE_MAX);
  if (title === enriched.title) return enriched;
  return (await updateInspiration(db, enriched.id, { title })) ?? enriched;
}

/** After 再取得, swap a slug/host/URL placeholder for the page title. Typed titles stay. */
export async function replaceDerivedTitleFromOgp(db: Db, row: Inspiration): Promise<Inspiration> {
  const ogTitle = row.ogTitle?.trim() ?? "";
  if (!ogTitle || !isDerivedInspirationTitle(row.title, row.url)) return row;
  const title = ogTitle.slice(0, INSPIRATION_TITLE_MAX);
  if (title === row.title) return row;
  return (await updateInspiration(db, row.id, { title })) ?? row;
}

export function titleForInspirationUpdate(
  prepared: PreparedInspiration,
  existingOgTitle: string | null | undefined,
  urlChanged: boolean,
): string {
  if (urlChanged) return prepared.title;
  return displayTitleForSave(prepared, existingOgTitle);
}
