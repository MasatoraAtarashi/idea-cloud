import type { LoaderFunctionArgs } from "react-router";
import { searchWorkspaceDb } from "../../../db/search";
import { appDb } from "../../lib/app-db";

/** Resource route for the ⌘K palette: ideas / comments / inspirations / tags. */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const db = appDb(context);
  return Response.json(await searchWorkspaceDb(db, query), {
    headers: { "cache-control": "no-store" },
  });
}
