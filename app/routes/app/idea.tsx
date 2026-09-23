import { useState } from "react";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunctionArgs,
} from "react-router";
import { EmptyState, StagePill, TagPill } from "../../components/ui";
import { IdeaComments } from "../../components/idea-comments";
import { IdeaDetailSwipe } from "../../components/idea-detail-swipe";
import { IdeaBrainstormControls } from "../../components/idea-brainstorm";
import { IdeaEditForm } from "../../components/idea-edit-form";
import { IdeaEvaluateControls } from "../../components/idea-evaluate";
import { IdeaHistory } from "../../components/idea-history";
import { IdeaReflectionForm } from "../../components/idea-reflection";
import { IdeaReviewPrompt } from "../../components/idea-review";
import { IdeaHumanScore } from "../../components/idea-score";
import { IdeaResearchControls, IdeaResearchNotes } from "../../components/idea-research";
import { StageSelect } from "../../components/stage-select";
import { SESSION_USER, STAGE_LABEL, nextStage } from "../../data/mock";
import { confirmIdeaDelete } from "../../lib/idea-delete";
import { formatAgedDays, formatDateJa, ideaPublicId } from "../../lib/format";
import { LIST_PATH } from "../../lib/home-path";
import { buildIdeaHistory } from "../../lib/idea-history";
import { ideaDetailAction } from "../../lib/idea-detail-action";
import {
  hashForIdeaDetailTab,
  IDEA_DETAIL_TAB_IDS,
  IDEA_DETAIL_TAB_LABEL,
  ideaDetailTabFromHash,
  type IdeaDetailTab,
} from "../../lib/idea-detail-tabs";
import { useInstantPending } from "../../lib/use-instant-pending";
import { createDb } from "../../../db/client";
import { listBrainstormsForIdea, toBrainstormView } from "../../../db/brainstorms";
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
    return { idea: undefined, comments: [], brainstorms: [] };
  }
  const [comments, brainstorms] = await Promise.all([
    listCommentsForIdea(db, Number(idea.id)),
    listBrainstormsForIdea(db, Number(idea.id)),
  ]);
  return {
    idea,
    comments: comments.map(toCommentView),
    brainstorms: brainstorms.map(toBrainstormView),
  };
}

export default function IdeaPage() {
  const { idea, comments, brainstorms } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof ideaDetailAction>();

  if (!idea) {
    return (
      <div className="px-6 py-6">
        <h1 className="ui-title text-[16px] tracking-tight">アイデア</h1>
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
  const reviewError = actionIntent === "review" ? actionError : undefined;
  const reflectionError = actionIntent === "reflection" ? actionError : undefined;
  const researchError =
    commentError ||
    brainstormError ||
    evaluateError ||
    editError ||
    scoreError ||
    reviewError ||
    reflectionError
      ? undefined
      : actionError;

  return (
    <IdeaDetail
      idea={idea}
      comments={comments}
      brainstorms={brainstorms}
      commentError={commentError}
      researchError={researchError}
      brainstormError={brainstormError}
      evaluateError={evaluateError}
      editError={editError}
      scoreError={scoreError}
      reviewError={reviewError}
      reflectionError={reflectionError}
    />
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
      <span className="hidden font-mono text-[11.5px] text-muted-foreground lg:inline">
        コメント {idea.commentCount}
      </span>
      {idea.researchedAt || idea.researchNotes ? (
        <span className="hidden font-mono text-[11.5px] text-muted-foreground lg:inline">
          調査済
        </span>
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
    <fetcher.Form method="post" className="min-w-0 flex-1" onSubmit={hold}>
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

function DeleteButton({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  return (
    <fetcher.Form
      method="post"
      onSubmit={(event) => {
        if (!confirmIdeaDelete(idea.title)) {
          event.preventDefault();
          return;
        }
        hold();
      }}
    >
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="redirectTo" value={LIST_PATH} />
      <button type="submit" disabled={pending} className="ui-btn-danger w-full justify-start px-3">
        {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? "削除中…" : "削除"}
      </button>
    </fetcher.Form>
  );
}

function IdeaDetailTabs({
  tab,
  onTab,
  commentCount,
}: {
  tab: IdeaDetailTab;
  onTab: (next: IdeaDetailTab) => void;
  commentCount: number;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {IDEA_DETAIL_TAB_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          aria-current={tab === id ? "page" : undefined}
          className={`flex min-h-11 shrink-0 items-center px-3 text-[13.5px] ${
            tab === id
              ? "border-b-2 border-foreground font-semibold text-foreground"
              : "font-medium text-muted-foreground"
          }`}
        >
          {IDEA_DETAIL_TAB_LABEL[id]}
          {id === "comments" ? (
            <span className="ml-1 font-mono text-[11px]">{commentCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function IdeaDetail({
  idea,
  comments,
  brainstorms,
  commentError,
  researchError,
  brainstormError,
  evaluateError,
  editError,
  scoreError,
  reviewError,
  reflectionError,
}: {
  idea: MockIdea;
  comments: ReturnType<typeof toCommentView>[];
  brainstorms: ReturnType<typeof toBrainstormView>[];
  commentError?: string;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  editError?: string;
  scoreError?: string;
  reviewError?: string;
  reflectionError?: string;
}) {
  const [editing, setEditing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const tab = ideaDetailTabFromHash(location.hash);
  const history = buildIdeaHistory(idea, brainstorms);

  function setTab(next: IdeaDetailTab) {
    const hash = hashForIdeaDetailTab(next);
    navigate(
      { pathname: location.pathname, search: location.search, hash },
      { replace: true, preventScrollReset: true },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <article className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] lg:px-8 lg:py-6">
        <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-1 lg:flex lg:items-start lg:justify-between lg:py-0">
            <Link
              to={LIST_PATH}
              className="flex min-h-11 min-w-[3.5rem] items-center text-[13.5px] font-medium text-foreground no-underline lg:hidden"
            >
              戻る
            </Link>
            <p className="idea-title-wrap ui-title line-clamp-2 text-center text-[15px] font-semibold leading-snug lg:hidden">
              {idea.title}
            </p>
            <p className="hidden font-mono text-[11.5px] text-muted-foreground lg:block">
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
              className="flex min-h-11 min-w-[3.5rem] items-center justify-end text-[13.5px] font-medium text-foreground lg:hidden"
            >
              {editing ? "閉じる" : "編集"}
            </button>
            <button
              type="button"
              onClick={() => setEditing((open) => !open)}
              className="ui-btn-secondary hidden min-w-[4.5rem] px-3 lg:inline-flex"
            >
              {editing ? "閉じる" : "編集"}
            </button>
          </div>
          <IdeaDetailTabs tab={tab} onTab={setTab} commentCount={comments.length} />
        </header>

        {tab === "overview" ? (
          <IdeaDetailSwipe
            idea={idea}
            editing={editing}
            onEdit={() => setEditing((open) => !open)}
            researchError={researchError}
            brainstormError={brainstormError}
            evaluateError={evaluateError}
          >
            <div className="mt-3 lg:mt-4">
              <IdeaMeta idea={idea} />
            </div>

            {editing ? (
              <IdeaEditForm idea={idea} onCancel={() => setEditing(false)} error={editError} />
            ) : (
              <>
                <h1 className="idea-title-wrap ui-title mt-3 text-[22px] leading-snug lg:text-[23px] lg:leading-[1.4]">
                  {idea.title}
                </h1>
                <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-foreground lg:mt-5 lg:text-[13.5px]">
                  {idea.body}
                </p>
                <IdeaTags idea={idea} />
              </>
            )}

            <div className="mt-5 lg:hidden">
              <StageAdvanceButton idea={idea} />
            </div>
          </IdeaDetailSwipe>
        ) : null}

        {tab === "overview" ? (
          <>
            <div className="lg:hidden">
              <IdeaReviewPrompt idea={idea} compact showNextStage={false} />
            </div>
            <div className="hidden lg:block">
              <IdeaReviewPrompt idea={idea} />
            </div>
            {reviewError ? <p className="mt-1.5 text-[12.5px] text-danger">{reviewError}</p> : null}
            <IdeaHumanScore idea={idea} error={scoreError} />
            <details className="mt-6 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer items-center text-[13.5px] font-medium">
                振り返り
              </summary>
              <IdeaReflectionForm idea={idea} error={reflectionError} />
            </details>
            <div className="hidden lg:block">
              <IdeaReflectionForm idea={idea} error={reflectionError} />
            </div>
            <div className="mt-6 lg:hidden">
              <DeleteButton idea={idea} />
            </div>
          </>
        ) : null}

        {tab === "research" ? (
          <section id="research" className="mt-4 max-w-2xl">
            <p className="rounded-md border border-border bg-muted/60 px-3 py-2 text-[12.5px] leading-relaxed text-foreground">
              ウェブで先行事例を数件取得し、本文と合わせて分析します。検索に失敗してもメモは残します。
            </p>
            <div className="mt-4 lg:hidden">
              <IdeaResearchControls idea={idea} error={researchError} />
            </div>
            <IdeaResearchNotes idea={idea} />
          </section>
        ) : null}

        {tab === "ai" ? (
          <div className="mt-4 max-w-2xl">
            <span id="history" className="sr-only">
              AI/履歴
            </span>
            <div className="mb-4 flex flex-col gap-2 lg:hidden">
              <IdeaBrainstormControls idea={idea} error={brainstormError} />
              <IdeaEvaluateControls idea={idea} error={evaluateError} />
            </div>
            <IdeaHistory items={history} />
          </div>
        ) : null}

        {tab === "comments" ? <IdeaComments comments={comments} error={commentError} /> : null}
      </article>

      <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-border px-4 py-6 lg:block">
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="ui-btn-secondary pointer-events-none h-8 opacity-60">
            <IconShare className="h-3.5 w-3.5" />
            共有
          </span>
        </div>
        <h2 className="text-[13.5px] font-semibold">このアイデアの操作</h2>
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
          <DeleteButton idea={idea} />
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
