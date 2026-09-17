import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { IdeaListView } from "../../components/idea-list-view";
import { createDb } from "../../../db/client";
import { listIdeaViews } from "../../../db/ideas";

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const ideas = await listIdeaViews(db);
  return { ideas };
}

export default function IdeasPage() {
  const { ideas } = useLoaderData<typeof loader>();
  return <IdeaListView ideas={ideas} />;
}
