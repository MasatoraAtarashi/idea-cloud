import { useLoaderData, useOutletContext, redirect, type LoaderFunctionArgs } from "react-router";
import type { AppData } from "./layout";
import { IdeaListView } from "../../components/idea-list-view";
import { dictionary } from "../../i18n/dictionary";
import { listIdeaViews } from "../../../db/ideas";
import { listSavedViews, savedViewJson } from "../../../db/saved-views";
import { isPeekOnlyChange } from "../../lib/idea-peek";
import { listViewAction } from "../../lib/list-view-action";
import {
  isDefaultListFilters,
  listViewHref,
  omitSavedViewId,
  parseListViewSearch,
} from "../../lib/list-view-search";
import { appDb } from "../../lib/app-db";
import type { Route } from "./+types/board";

export { listViewAction as action };

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").list.metaTitle }];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = appDb(context);
  const ideas = await listIdeaViews(db);
  const savedViews = (await listSavedViews(db)).map(savedViewJson);
  const parsed = parseListViewSearch(new URL(request.url).searchParams);
  if (parsed.savedViewId) {
    const match = savedViews.find((view) => view.id === parsed.savedViewId);
    if (match && isDefaultListFilters(omitSavedViewId(parsed))) {
      throw redirect(listViewHref({ ...match.filters, savedViewId: match.id }));
    }
  }
  return { ideas, savedViews, locale: context.locale };
}

/**
 * Opening the quick-peek drawer only changes `?peek`, and the drawer renders
 * from the list we already hold — so flipping through a shelf should not cost
 * a query per stop. Anything else, including every form post, revalidates.
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: {
  currentUrl: URL;
  nextUrl: URL;
  formMethod?: string;
  defaultShouldRevalidate: boolean;
}) {
  if (!formMethod && isPeekOnlyChange(currentUrl, nextUrl)) return false;
  return defaultShouldRevalidate;
}

export default function IdeasPage() {
  const { ideas, savedViews } = useLoaderData<typeof loader>();
  const { categories } = useOutletContext<AppData>();
  return <IdeaListView ideas={ideas} savedViews={savedViews} categories={categories} />;
}
