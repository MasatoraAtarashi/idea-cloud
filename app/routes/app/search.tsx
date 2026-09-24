import type { LoaderFunctionArgs } from "react-router";
import { createDb } from "../../../db/client";
import { searchWorkspaceDb } from "../../../db/search";

/** Resource route for the ⌘K palette: ideas / comments / inspirations / tags. */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const db = createDb(context.cloudflare.env.DB);
  return Response.json(await searchWorkspaceDb(db, query), {
    headers: { "cache-control": "no-store" },
  });
}
