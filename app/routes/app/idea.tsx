import { useState } from "react";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { EmptyState, StagePill, TagPill } from "../../components/ui";
import { IdeaAiMenu } from "../../components/idea-ai-menu";
import { IdeaComments } from "../../components/idea-comments";
import { IdeaBrainstormControls, IdeaBrainstormNotes } from "../../components/idea-brainstorm";
import { IdeaEditForm } from "../../components/idea-edit-form";
import { IdeaEvaluateControls, IdeaEvaluateNotes } from "../../components/idea-evaluate";
import { IdeaHumanScore } from "../../components/idea-score";
import { IdeaResearchControls, IdeaResearchNotes } from "../../components/idea-research";
import { StageSelect } from "../../components/stage-select";
import { SESSION_USER, STAGE_LABEL, nextStage } from "../../data/mock";
import { formatAgedDays, formatDateJa, ideaPublicId } from "../../lib/format";
import { LIST_PATH } from "../../lib/home-path";
import { ideaDetailAction } from "../../lib/idea-detail-action";
import { useInstantPending } from "../../lib/use-instant-pending";
import { createDb } from "../../../db/client";
import { listCommentsForIdea, toCommentView } from "../../../db/comments";
import { getIdeaView } from "../../../db/ideas";
import { IconMerge, IconShare, IconSpinner } from "../../components/icons";
import type { MockIdea } from "../../data/mock";

export { ideaDetailAction as action };

export function meta() {
  return [{ title: "アイデア — アイデアクラウド" }];
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const idea = await getIdeaView(db, params.ideaId);
  if (!idea) {
    return { idea: undefined, comments: [] };
  }
  const comments = await listCommentsForIdea(db, Number(idea.id));
  return { idea, comments: comments.map(toCommentView) };
}

export default function IdeaPage() {
  const { idea, comments } = useLoaderData<typeof loader>();
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

  const actionError =
    actionData && "error" in actionData && actionData.error ? actionData.error : undefined;
  const actionIntent = actionData && "intent" in actionData ? actionData.intent : undefined;
  const commentError = actionIntent === "comment" ? actionError : undefined;
  const brainstormError = actionIntent === "brainstorm" ? actionError : undefined;
  const evaluateError = actionIntent === "evaluate" ? actionError : undefined;
  const editError = actionIntent === "edit" ? actionError : undefined;
  const scoreError = actionIntent === "human-score" ? actionError : undefined;
  const researchError =
    commentError || brainstormError || evaluateError || editError || scoreError
      ? undefined
      : actionError;

  return (
    <>
      <MobileIdeaDetail
        idea={idea}
        comments={comments}
        commentError={commentError}
        researchError={researchError}
        brainstormError={brainstormError}
        evaluateError={evaluateError}
        editError={editError}
        scoreError={scoreError}
      />
      <DesktopIdeaDetail
        idea={idea}
        comments={comments}
        commentError={commentError}
        researchError={researchError}
        brainstormError={brainstormError}
        evaluateError={evaluateError}
        editError={editError}
        scoreError={scoreError}
      />
    </>
  );
}

function IdeaMeta({ idea }: { idea: MockIdea }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StagePill stage={idea.stage} />
      <span
        className={`font-mono text-[11.5px] ${
          idea.agedDays > 30 ? "text-[var(--stage-aging-fg)]" : "text-muted-foreground"
        }`}
      >
        熟成 {formatAgedDays(idea.agedDays)}
      </span>
      <span className="font-mono text-[11.5px] text-muted-foreground">
        コメント {idea.commentCount}
      </span>
      {idea.researchedAt || idea.researchNotes ? (
        <span className="font-mono text-[11.5px] text-muted-foreground">調査済</span>
      ) : null}
    </div>
  );
}

function IdeaTags({ idea }: { idea: MockIdea }) {
  if (idea.tags.length > 0) {
    return (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {idea.tags.map((tag) => (
          <TagPill key={tag} label={tag} />
        ))}
      </div>
    );
  }
  return <p className="mt-3 text-[12.5px] text-muted-foreground">自動タグは付きませんでした</p>;
}

function StageAdvanceButton({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  const next = nextStage(idea.stage);
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  if (!next) return null;
  return (
    <fetcher.Form method="post" className="flex-1" onSubmit={hold}>
      <input type="hidden" name="intent" value="stage" />
      <input type="hidden" name="stage" value={next} />
      <button type="submit" disabled={pending} className="ui-btn w-full px-3 text-[13px]">
        {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? "更新中…" : `次の段階へ（${STAGE_LABEL[next]}）`}
      </button>
    </fetcher.Form>
  );
}

function ArchiveButton({ idea, ghost = false }: { idea: MockIdea; ghost?: boolean }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  return (
    <fetcher.Form method="post" onSubmit={hold}>
      <input type="hidden" name="intent" value="stage" />
      <input type="hidden" name="stage" value="archived" />
      <button
        type="submit"
        disabled={pending || idea.stage === "archived"}
        className={
          ghost
            ? "ui-btn-ghost w-full justify-start px-3 text-[13px]"
            : "ui-btn-secondary px-3 text-[13px]"
        }
      >
        {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? "更新中…" : "アーカイブ"}
      </button>
    </fetcher.Form>
  );
}

function MobileIdeaDetail({
  idea,
  comments,
  commentError,
  researchError,
  brainstormError,
  evaluateError,
  editError,
  scoreError,
}: {
  idea: MockIdea;
  comments: ReturnType<typeof toCommentView>[];
  commentError?: string;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  editError?: string;
  scoreError?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <article className="flex min-h-0 flex-1 flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
      <header className="flex items-center justify-between gap-3">
        <Link
          to={LIST_PATH}
          className="flex min-h-11 items-center text-[13.5px] text-muted-foreground no-underline"
        >
          戻る
        </Link>
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className="ui-btn-secondary px-3"
        >
          {editing ? "閉じる" : "編集"}
        </button>
      </header>
      <div className="mt-3">
        <IdeaMeta idea={idea} />
      </div>
      {editing ? (
        <IdeaEditForm idea={idea} onCancel={() => setEditing(false)} error={editError} />
      ) : (
        <>
          <h1 className="idea-title-wrap ui-title mt-3 text-[22px] leading-snug">{idea.title}</h1>
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
            {idea.body}
          </p>
          <IdeaTags idea={idea} />
        </>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <StageAdvanceButton idea={idea} />
        <div className="min-w-[5.5rem] flex-1">
          <IdeaAiMenu
            idea={idea}
            researchError={researchError}
            brainstormError={brainstormError}
            evaluateError={evaluateError}
          />
        </div>
        <ArchiveButton idea={idea} />
      </div>
      <IdeaHumanScore idea={idea} compact error={scoreError} />
      <IdeaComments comments={comments} error={commentError} compact />
      <details className="mt-8">
        <summary className="flex min-h-11 cursor-pointer items-center text-[13.5px] font-medium">
          リサーチ・ブレスト・評価の記録
        </summary>
        <div className="pb-4">
          <IdeaResearchNotes idea={idea} />
          <IdeaBrainstormNotes idea={idea} />
          <IdeaEvaluateNotes idea={idea} />
        </div>
      </details>
    </article>
  );
}

function DesktopIdeaDetail({
  idea,
  comments,
  commentError,
  researchError,
  brainstormError,
  evaluateError,
  editError,
  scoreError,
}: {
  idea: MockIdea;
  comments: ReturnType<typeof toCommentView>[];
  commentError?: string;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  editError?: string;
  scoreError?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="hidden min-h-0 flex-1 lg:flex">
      <article className="min-w-0 flex-1 px-8 py-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11.5px] text-muted-foreground">
            <Link
              to={LIST_PATH}
              className="text-muted-foreground no-underline hover:text-foreground"
            >
              アイデア
            </Link>
            <span className="mx-2">/</span>
            {ideaPublicId(idea.id)}
          </p>
          <button
            type="button"
            onClick={() => setEditing((open) => !open)}
            className="ui-btn-secondary px-3"
          >
            {editing ? "閉じる" : "編集"}
          </button>
        </div>
        <div className="mt-4">
          <IdeaMeta idea={idea} />
        </div>
        {editing ? (
          <IdeaEditForm idea={idea} onCancel={() => setEditing(false)} error={editError} />
        ) : (
          <>
            <h1 className="idea-title-wrap ui-title mt-3 text-[23px] leading-[1.4]">
              {idea.title}
            </h1>
            <IdeaTags idea={idea} />
            <p className="mt-5 max-w-2xl whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
              {idea.body}
            </p>
          </>
        )}
        <IdeaHumanScore idea={idea} error={scoreError} />
        <IdeaComments comments={comments} error={commentError} />
      </article>

      <aside id="research" className="w-72 shrink-0 border-l border-border px-4 py-6">
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="ui-btn-secondary pointer-events-none h-8 opacity-60">
            <IconShare className="h-3.5 w-3.5" />
            共有
          </span>
        </div>
        <h2 className="text-[13.5px] font-medium">このアイデアの操作</h2>
        <div className="mt-2 flex flex-col gap-1.5">
          <IdeaResearchControls idea={idea} error={researchError} />
          <IdeaBrainstormControls idea={idea} error={brainstormError} />
          <IdeaEvaluateControls idea={idea} error={evaluateError} />
          <Link
            to={`/app/merge?from=${idea.id}`}
            className="ui-btn-secondary justify-start px-3 text-[13px]"
          >
            <IconMerge className="h-3.5 w-3.5" />
            他のアイデアと融合
          </Link>
          <ArchiveButton idea={idea} ghost />
        </div>

        <dl className="mt-6 space-y-3 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">段階</dt>
            <dd>
              <StageFetcher idea={idea} />
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
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">更新</dt>
            <dd className="font-mono text-[11.5px]">{formatDateJa(idea.updatedAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">コメント</dt>
            <dd className="font-mono text-[11.5px]">{idea.commentCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">リサーチ</dt>
            <dd className="text-[12.5px]">
              {idea.researchedAt || idea.researchNotes ? "調査済" : "未実行"}
            </dd>
          </div>
        </dl>

        <IdeaResearchNotes idea={idea} />
        <IdeaBrainstormNotes idea={idea} />
        <IdeaEvaluateNotes idea={idea} />
      </aside>
    </div>
  );
}

function StageFetcher({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="stage" />
      <StageSelect defaultValue={idea.stage} autoSubmit />
    </fetcher.Form>
  );
}
