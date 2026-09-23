import { Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { AppShell } from "../../components/shell";
import type { IdeaCategory } from "../../lib/category";
import { createDb } from "../../../db/client";
import { listCategoryViews } from "../../../db/categories";

export type AppData = {
  categories: IdeaCategory[];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  return { categories: await listCategoryViews(db) } satisfies AppData;
}

export default function AppLayout() {
  const { categories } = useLoaderData<typeof loader>();
  return (
    <AppShell categories={categories}>
      <Outlet context={{ categories } satisfies AppData} />
    </AppShell>
  );
}
