import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { AppShell, type ShellNav } from "../../components/shell";
import { isReviewCandidate } from "../../data/mock";
import type { IdeaCategory } from "../../lib/category";
import { createDb } from "../../../db/client";
import { listCategoryViews } from "../../../db/categories";
import { listIdeaViews } from "../../../db/ideas";
import { listInspirationRows } from "../../../db/inspirations";
import { listSavedViews, savedViewJson } from "../../../db/saved-views";

export type AppData = {
  categories: IdeaCategory[];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const [categories, ideas, inspirations, savedViews] = await Promise.all([
    listCategoryViews(db),
    listIdeaViews(db),
    listInspirationRows(db),
    listSavedViews(db),
  ]);
  const nav: ShellNav = {
    ideaCount: ideas.length,
    inspirationCount: inspirations.length,
    reviewCount: ideas.filter((idea) => isReviewCandidate(idea)).length,
    savedViews: savedViews.map(savedViewJson),
    ideas: [...ideas]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((idea) => ({ id: idea.id, title: idea.title, stage: idea.stage })),
  };
  return { categories, nav };
}

export default function AppLayout() {
  const { categories, nav } = useLoaderData<typeof loader>();
  return (
    <AppShell categories={categories} nav={nav}>
      <Outlet context={{ categories } satisfies AppData} />
    </AppShell>
  );
}
