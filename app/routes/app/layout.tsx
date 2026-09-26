import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { AppShell, type ShellNav } from "../../components/shell";
import { isReviewCandidate } from "../../data/mock";
import type { IdeaCategory } from "../../lib/category";
import type { CurrentWorkspace } from "../../../server/tenant/workspace";
import { listCategoryViews } from "../../../db/categories";
import { listIdeaViews } from "../../../db/ideas";
import { listInspirationRows } from "../../../db/inspirations";
import { listSavedViews, savedViewJson } from "../../../db/saved-views";
import { appDb } from "../../lib/app-db";

export type AppData = {
  categories: IdeaCategory[];
  /** Workspace this session acts in (non-null under /app). */
  workspace: CurrentWorkspace;
  /** Signed-in Google email from the session cookie. */
  userEmail: string | null;
  /** True when the signed-in email is entitled to the AI features. */
  premium: boolean;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const db = appDb(context);
  const workspace = context.workspace!;
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
    userEmail: context.userEmail,
    workspaceName: workspace.name,
  };
  return {
    workspace,
    categories,
    nav,
    userEmail: context.userEmail,
    premium: context.plan === "premium",
  };
}

export default function AppLayout() {
  const { categories, nav, userEmail, premium, workspace } = useLoaderData<typeof loader>();
  return (
    <AppShell categories={categories} nav={nav}>
      <Outlet context={{ categories, workspace, userEmail, premium } satisfies AppData} />
    </AppShell>
  );
}
