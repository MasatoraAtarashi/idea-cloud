import { Form, Link, useActionData, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { EmptyState, StagePill, TagPill } from "../../components/ui";
import { IdeaResearchSection } from "../../components/idea-research";
import { StageSelect } from "../../components/stage-select";
import { SESSION_USER } from "../../data/mock";
import { formatAgedDays, formatDateJa, ideaPublicId } from "../../lib/format";
import { LIST_PATH } from "../../lib/home-path";
import { ideaDetailAction } from "../../lib/idea-detail-action";
import { createDb } from "../../../db/client";
import { getIdeaView } from "../../../db/ideas";
import { IconMerge, IconSearch, IconShare } from "../../components/icons";

export { ideaDetailAction as action };

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
  const actionData = useActionData<typeof ideaDetailAction>();

  if (!idea) {
    return (
      <div className="px-6 py-6">
        <h1 className="text-[16px] font-medium tracking-tight">アイデア</h1>
        <div className="mt-4">
          <EmptyState title="まだありません" />
        </div>
        <Link
          to={LIST_PATH}
          className="mt-4 inline-block text-[13.5px] text-muted-foreground no-underline hover:text-foreground"
        >
          一覧
        </Link>
      </div>
    );
  }

  const researchReady = idea.stage === "selected";
  const actionError = actionData && "error" in actionData ? actionData.error : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <article className="min-w-0 flex-1 px-5 py-5 md:px-8 md:py-6">
        <p className="font-mono text-[11.5px] text-muted-foreground">
          <Link to={LIST_PATH} className="text-muted-foreground no-underline hover:text-foreground">
            アイデア
          </Link>
          <span className="mx-2">/</span>
          {ideaPublicId(idea.id)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StagePill stage={idea.stage} />
          <span
            className={`font-mono text-[11.5px] ${
              idea.agedDays > 30 ? "text-[var(--stage-aging-fg)]" : "text-muted-foreground"
            }`}
          >
            熟成 {formatAgedDays(idea.agedDays)}
          </span>
        </div>
        <h1 className="ui-title mt-3 text-[23px] leading-[1.4]">{idea.title}</h1>
        {idea.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {idea.tags.map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
        ) : null}
        <p className="mt-5 max-w-2xl whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
          {idea.body}
        </p>
        <section className="mt-10">
          <h2 className="text-[16px] font-medium">アクティビティ</h2>
          <ul className="mt-3 space-y-2 text-[12.5px] text-muted-foreground">
            <li>
              {SESSION_USER.label} が作成 {formatDateJa(idea.createdAt)}
            </li>
            {idea.researchedAt ? (
              <li>
                {SESSION_USER.label} がリサーチを実行 {formatDateJa(idea.researchedAt)}
              </li>
            ) : null}
          </ul>
        </section>
        <div className="lg:hidden">
          <IdeaResearchSection idea={idea} error={actionError} />
        </div>
      </article>

      <aside
        id="research"
        className="w-full shrink-0 border-t border-border px-5 py-5 lg:w-72 lg:border-l lg:border-t-0 lg:px-4 lg:py-6"
      >
        <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">
          <span className="ui-btn-secondary pointer-events-none h-8 opacity-60">
            <IconShare className="h-3.5 w-3.5" />
            共有
          </span>
        </div>
        <h2 className="text-[13.5px] font-medium">このアイデアの操作</h2>
        <div className="mt-2 flex flex-col gap-1.5">
          <Link
            to={`/app/merge?from=${idea.id}`}
            className="ui-btn-secondary h-9 justify-start px-3 text-[13px]"
          >
            <IconMerge className="h-3.5 w-3.5" />
            他のアイデアと融合
          </Link>
          {researchReady ? (
            <a href="#research" className="ui-btn-secondary h-9 justify-start px-3 text-[13px]">
              <IconSearch className="h-3.5 w-3.5" />
              リサーチを実行
            </a>
          ) : (
            <span className="ui-btn-secondary h-9 cursor-not-allowed justify-start px-3 text-[13px] opacity-40">
              <IconSearch className="h-3.5 w-3.5" />
              リサーチを実行
            </span>
          )}
          <Form method="post">
            <input type="hidden" name="intent" value="stage" />
            <input type="hidden" name="stage" value="archived" />
            <button
              type="submit"
              className="ui-btn-ghost h-9 w-full justify-start px-3 text-[13px]"
            >
              アーカイブへ移す
            </button>
          </Form>
        </div>

        <dl className="mt-6 space-y-3 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">段階</dt>
            <dd>
              <Form method="post">
                <input type="hidden" name="intent" value="stage" />
                <StageSelect defaultValue={idea.stage} autoSubmit />
              </Form>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">起案者</dt>
            <dd>{SESSION_USER.label}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">作成</dt>
            <dd className="font-mono text-[11.5px]">{formatDateJa(idea.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 hidden lg:block">
          <IdeaResearchSection idea={idea} error={actionError} compact />
        </div>
      </aside>
    </div>
  );
}
