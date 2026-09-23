import { useLoaderData, useOutletContext, redirect, type LoaderFunctionArgs } from "react-router";
import type { AppData } from "./layout";
import { IdeaListView } from "../../components/idea-list-view";
import { createDb } from "../../../db/client";
import { listIdeaViews } from "../../../db/ideas";
import { listSavedViews, savedViewJson } from "../../../db/saved-views";
import { listViewAction } from "../../lib/list-view-action";
import {
  isDefaultListFilters,
  listViewHref,
  omitSavedViewId,
  parseListViewSearch,
} from "../../lib/list-view-search";

export { listViewAction as action };

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const ideas = await listIdeaViews(db);
  const savedViews = (await listSavedViews(db)).map(savedViewJson);
  const parsed = parseListViewSearch(new URL(request.url).searchParams);
  if (parsed.savedViewId) {
    const match = savedViews.find((view) => view.id === parsed.savedViewId);
    if (match && isDefaultListFilters(omitSavedViewId(parsed))) {
      throw redirect(listViewHref({ ...match.filters, savedViewId: match.id }));
    }
  }
  return { ideas, savedViews };
}

export default function IdeasPage() {
  const { ideas, savedViews } = useLoaderData<typeof loader>();
  const { categories } = useOutletContext<AppData>();
  return <IdeaListView ideas={ideas} savedViews={savedViews} categories={categories} />;
}
