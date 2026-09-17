import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { EmptyState, StagePill, TagPill } from "../../components/ui";
import { STAGE_LABEL } from "../../data/mock";
import { LIST_PATH } from "../../lib/home-path";
import { createDb } from "../../../db/client";
import { getIdeaView } from "../../../db/ideas";

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const idea = await getIdeaView(db, params.ideaId);
  return { idea };
}

export default function IdeaPage() {
  const { idea } = useLoaderData<typeof loader>();

  if (!idea) {
    return (
      <div>
        <h1 className="text-lg font-semibold tracking-tight">アイデア</h1>
        <div className="ui-panel mt-4">
          <EmptyState title="まだありません" />
        </div>
        <Link
          to={LIST_PATH}
          className="mt-4 inline-block text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          一覧
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground">
        <Link to={LIST_PATH} className="text-foreground no-underline hover:underline">
          アイデア
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-2 text-xl font-semibold leading-snug">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{idea.agedDays}日</span>
        <span>·</span>
        <span>{idea.createdAt}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StagePill stage={idea.stage} />
        {idea.tags.map((tag) => (
          <TagPill key={tag} label={tag} />
        ))}
      </div>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {idea.body}
      </p>
      <section className="mt-8 grid gap-2 sm:grid-cols-4">
        {[
          ["進める", "/app/research"],
          ["融合する", "/app/merge"],
          ["アーカイブ", LIST_PATH],
          ["捨てる", LIST_PATH],
        ].map(([label, href]) => (
          <Link key={label} to={href} className="ui-btn-ghost px-3 py-2 text-center text-sm">
            {label}
          </Link>
        ))}
      </section>
    </article>
  );
}
