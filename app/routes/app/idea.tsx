import { Link, useActionData, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { EmptyState, StagePill, TagPill } from "../../components/ui";
import { IdeaResearchSection } from "../../components/idea-research";
import { STAGE_LABEL } from "../../data/mock";
import { LIST_PATH } from "../../lib/home-path";
import { researchIdeaAction } from "../../lib/idea-research-action";
import { createDb } from "../../../db/client";
import { getIdeaView } from "../../../db/ideas";

export { researchIdeaAction as action };

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
  const actionData = useActionData<typeof researchIdeaAction>();

  if (!idea) {
    return (
      <div>
        <h1 className="text-[15px] font-medium tracking-tight">アイデア</h1>
        <div className="ui-panel mt-4">
          <EmptyState title="まだありません" />
        </div>
        <Link
          to={LIST_PATH}
          className="mt-4 inline-block text-[13px] text-muted-foreground no-underline hover:text-foreground"
        >
          一覧
        </Link>
      </div>
    );
  }

  const researchReady = idea.stage === "selected";
  const actionError = actionData && "error" in actionData ? actionData.error : undefined;

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground">
        <Link to={LIST_PATH} className="text-foreground no-underline hover:underline">
          アイデア
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-2 text-lg font-medium leading-snug">{idea.title}</h1>
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
      <p className="mt-6 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
        {idea.body}
      </p>
      <section className="mt-8 grid gap-2 sm:grid-cols-4">
        <Link
          to={`/app/merge?from=${idea.id}`}
          className="ui-btn-ghost px-3 py-2 text-center text-[13px]"
        >
          融合
        </Link>
        {researchReady ? (
          <a href="#research" className="ui-btn-ghost px-3 py-2 text-center text-[13px]">
            リサーチ
          </a>
        ) : (
          <span
            className="ui-btn-ghost cursor-not-allowed px-3 py-2 text-center text-[13px] opacity-40"
            title="採用してから"
          >
            リサーチ
          </span>
        )}
        <Link to={LIST_PATH} className="ui-btn-ghost px-3 py-2 text-center text-[13px]">
          アーカイブ
        </Link>
        <Link to={LIST_PATH} className="ui-btn-ghost px-3 py-2 text-center text-[13px]">
          捨てる
        </Link>
      </section>
      <IdeaResearchSection idea={idea} error={actionError} />
    </article>
  );
}
