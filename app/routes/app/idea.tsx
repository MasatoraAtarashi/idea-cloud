import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunctionArgs,
} from "react-router";
import { AiWorkbench } from "../../components/ai-workbench";
import { shortAgo } from "../../components/ai-format";
import { EmptyState, StageDot, StagePill, TagPill } from "../../components/ui";
import { IdeaComments } from "../../components/idea-comments";
import { IdeaDetailSwipe } from "../../components/idea-detail-swipe";
import { IdeaEditForm } from "../../components/idea-edit-form";
import { IdeaReflectionForm } from "../../components/idea-reflection";
import { IdeaReviewBand } from "../../components/idea-review";
import { IdeaHumanScore } from "../../components/idea-score";
import { PopoverMenu } from "../../components/popover-menu";
import { StageSelect } from "../../components/stage-select";
import { nextStage } from "../../data/mock";
import { useT } from "../../i18n/context";
import { dictionary } from "../../i18n/dictionary";
import { LIST_PATH } from "../../lib/home-path";
import { ideaDetailAction } from "../../lib/idea-detail-action";
import {
  hashForIdeaDetailTab,
  hashTargetsAi,
  ideaDetailTabFromHash,
  type IdeaDetailTab,
} from "../../lib/idea-detail-tabs";
import { useInstantPending } from "../../lib/use-instant-pending";
import { createDb } from "../../../db/client";
import { listBrainstormsForIdea, toBrainstormView } from "../../../db/brainstorms";
import { listCommentsForIdea, toCommentView } from "../../../db/comments";
import { listChatMessagesForIdea, toChatMessageView } from "../../../db/discussions";
import { getIdeaView } from "../../../db/ideas";
import { IdeaCopyButton } from "../../components/idea-copy-button";
import { IconSpinner } from "../../components/icons";
import type { MockIdea } from "../../data/mock";
import type { Route } from "./+types/idea";

export { ideaDetailAction as action };

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").idea.metaTitle }];
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const idea = await getIdeaView(db, params.ideaId);
  if (!idea) {
    return {
      locale: context.locale,
      premium: context.plan === "premium",
      idea: undefined,
      comments: [],
      brainstorms: [],
      discussions: [],
    };
  }
  const [comments, brainstorms, discussions] = await Promise.all([
    listCommentsForIdea(db, Number(idea.id)),
    listBrainstormsForIdea(db, Number(idea.id)),
    listChatMessagesForIdea(db, Number(idea.id)),
  ]);
  return {
    locale: context.locale,
    premium: context.plan === "premium",
    idea,
    comments: comments.map(toCommentView),
    brainstorms: brainstorms.map(toBrainstormView),
    discussions: discussions.flatMap((row) => {
      const view = toChatMessageView(row);
      return view ? [view] : [];
    }),
  };
}

export default function IdeaPage() {
  const t = useT();
  const { idea, comments, brainstorms, discussions, premium } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof ideaDetailAction>();

  if (!idea) {
    return (
      <div className="px-6 py-6">
        <h1 className="ui-title text-[16px] tracking-tight">{t.idea.heading}</h1>
        <div className="mt-4">
          <EmptyState title={t.idea.empty} />
        </div>
        <Link
          to={LIST_PATH}
          className="mt-4 inline-block text-[13.5px] text-muted-foreground no-underline hover:text-foreground"
        >
          {t.idea.listLink}
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
  const discussError = actionIntent === "discuss" ? actionError : undefined;
  const editError = actionIntent === "edit" ? actionError : undefined;
  const scoreError = actionIntent === "human-score" ? actionError : undefined;
  const reviewError = actionIntent === "review" ? actionError : undefined;
  const reflectionError = actionIntent === "reflection" ? actionError : undefined;
  const researchError =
    commentError ||
    brainstormError ||
    evaluateError ||
    discussError ||
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
      discussions={discussions}
      commentError={commentError}
      researchError={researchError}
      brainstormError={brainstormError}
      evaluateError={evaluateError}
      discussError={discussError}
      editError={editError}
      scoreError={scoreError}
      reviewError={reviewError}
      reflectionError={reflectionError}
      premium={premium}
    />
  );
}

type DetailSide = "idea" | "ai";

function StageAdvanceButton({ idea, className = "" }: { idea: MockIdea; className?: string }) {
  const t = useT();
  const fetcher = useFetcher();
  const next = nextStage(idea.stage);
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const locked = !next;
  return (
    <fetcher.Form method="post" className={className} onSubmit={hold}>
      <input type="hidden" name="intent" value="stage" />
      {next ? <input type="hidden" name="stage" value={next} /> : null}
      <button
        type="submit"
        disabled={pending || locked}
        title={
          idea.stage === "archived"
            ? t.idea.nextStageArchived
            : next
              ? t.idea.nextStageTo(t.common.stage[next])
              : t.idea.nextStageLast
        }
        className="ui-btn w-full px-3.5"
      >
        {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? t.idea.updating : t.idea.nextStage}
      </button>
    </fetcher.Form>
  );
}

function MoreMenu({ idea }: { idea: MockIdea }) {
  const t = useT();
  const stageFetcher = useFetcher();
  const archiveFetcher = useFetcher();
  const archivePending = useInstantPending(archiveFetcher.state !== "idle");
  const item =
    "flex min-h-11 w-full items-center px-3 text-left text-[13px] text-secondary no-underline hover:bg-sunken md:min-h-9";
  return (
    <PopoverMenu
      label={t.idea.moreActions}
      trigger={
        <span className="flex h-full w-full items-center justify-center rounded-[7px] border border-border-control bg-card text-[14px] leading-none text-secondary">
          ⋯
        </span>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-[12px] text-muted-foreground">{t.idea.changeStage}</span>
            <stageFetcher.Form method="post">
              <input type="hidden" name="intent" value="stage" />
              <StageSelect defaultValue={idea.stage} autoSubmit />
            </stageFetcher.Form>
          </div>
          <div className="my-1 border-t border-border" />
          <Link to={`/app/merge?from=${idea.id}`} role="menuitem" className={item}>
            {t.idea.mergeWithOther}
          </Link>
          {idea.stage !== "archived" ? (
            <button
              type="button"
              role="menuitem"
              disabled={archivePending.pending}
              className={item}
              onClick={() => {
                archivePending.hold();
                const data = new FormData();
                data.set("intent", "stage");
                data.set("stage", "archived");
                void archiveFetcher.submit(data, { method: "post" });
                close();
              }}
            >
              {archivePending.pending ? t.idea.updating : t.idea.archive}
            </button>
          ) : null}
        </>
      )}
    </PopoverMenu>
  );
}

function IdeaHeaderMeta({ idea }: { idea: MockIdea }) {
  const t = useT();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <StagePill stage={idea.stage} />
      <span className="font-mono text-[12px] text-muted-foreground">
        {t.idea.agedDaysShort(idea.agedDays)}
      </span>
      {idea.categoryName ? (
        <span className="truncate text-[12px] text-muted-foreground">{idea.categoryName}</span>
      ) : null}
    </div>
  );
}

function IdeaTags({ idea }: { idea: MockIdea }) {
  const t = useT();
  if (idea.tags.length > 0) {
    return (
      <div className="mt-5 flex flex-wrap gap-1.5">
        {idea.tags.map((tag) => (
          <TagPill key={tag} label={tag} large />
        ))}
      </div>
    );
  }
  return <p className="mt-5 text-[11.5px] text-muted-foreground">{t.idea.noAutoTags}</p>;
}

function SelfReview({
  idea,
  scoreError,
  reflectionError,
}: {
  idea: MockIdea;
  scoreError?: string;
  reflectionError?: string;
}) {
  const t = useT();
  const summary = [
    idea.humanScore ? t.idea.selfReview.score(idea.humanScore) : "",
    idea.reflectionOutcome?.trim() ? t.idea.selfReview.hasReflection : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <details className="group mt-8 border-t border-border pt-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[13px] font-semibold md:min-h-8">
        {t.idea.selfReview.heading}
        {summary ? (
          <span className="font-mono text-[11.5px] font-normal text-muted-foreground">
            {summary}
          </span>
        ) : null}
        <span className="ml-auto text-[12px] font-normal text-muted-foreground group-open:hidden">
          {t.idea.selfReview.open}
        </span>
      </summary>
      <IdeaHumanScore idea={idea} error={scoreError} />
      <IdeaReflectionForm idea={idea} error={reflectionError} />
    </details>
  );
}

function IdeaDetail({
  idea,
  comments,
  brainstorms,
  discussions,
  commentError,
  researchError,
  brainstormError,
  evaluateError,
  discussError,
  editError,
  scoreError,
  reviewError,
  reflectionError,
  premium,
}: {
  idea: MockIdea;
  comments: ReturnType<typeof toCommentView>[];
  brainstorms: ReturnType<typeof toBrainstormView>[];
  discussions: NonNullable<ReturnType<typeof toChatMessageView>>[];
  commentError?: string;
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  discussError?: string;
  editError?: string;
  scoreError?: string;
  reviewError?: string;
  reflectionError?: string;
  premium: boolean;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // The URL hash is not sent to the server, so the first paint stays on the discuss tab.
  const [hashReady, setHashReady] = useState(false);
  const [side, setSide] = useState<DetailSide>("idea");
  useEffect(() => {
    setHashReady(true);
    if (hashTargetsAi(window.location.hash)) setSide("ai");
  }, []);
  const tab = hashReady ? ideaDetailTabFromHash(location.hash) : "discuss";
  const toggleEdit = useCallback(() => setEditing((open) => !open), []);

  function setTab(next: IdeaDetailTab) {
    navigate(
      { pathname: location.pathname, search: location.search, hash: hashForIdeaDetailTab(next) },
      { replace: true, preventScrollReset: true },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(420px,36vw,500px)]">
      {/* Mobile header: back, title, stage. */}
      <header className="shrink-0 border-b border-border bg-card px-2 pt-[max(0.25rem,env(safe-area-inset-top))] lg:hidden">
        <div className="flex items-center gap-1">
          <Link
            to={LIST_PATH}
            aria-label={t.idea.backToList}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-[18px] text-foreground no-underline"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1 py-1.5">
            <p className="idea-title-wrap line-clamp-1 text-[14.5px] font-semibold">{idea.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-warn">
              <StageDot stage={idea.stage} />
              <span className="text-secondary">{t.common.stage[idea.stage]}</span>
              <span className="font-mono text-muted-foreground">
                {t.idea.agedDaysShort(idea.agedDays)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={toggleEdit}
            className="flex min-h-11 min-w-11 items-center justify-center px-2 text-[13px] font-medium text-secondary"
          >
            {editing ? t.common.close : t.idea.editButton}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-2.5" role="tablist">
          {(["idea", "ai"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={side === value}
              onClick={() => setSide(value)}
              className={`min-h-11 rounded-[8px] text-[13.5px] ${
                side === value
                  ? "bg-foreground font-semibold text-white"
                  : "bg-muted font-medium text-tertiary"
              }`}
            >
              {value === "idea" ? t.idea.heading : t.idea.aiTab}
            </button>
          ))}
        </div>
      </header>

      {/* Thinking column. */}
      <article
        className={`${side === "idea" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:flex`}
      >
        <header className="hidden h-[65px] shrink-0 items-center justify-between gap-3 border-b border-border px-7 lg:flex">
          <IdeaHeaderMeta idea={idea} />
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={toggleEdit} className="ui-btn-secondary px-3">
              {editing ? t.common.close : t.idea.editButton}
            </button>
            <IdeaCopyButton idea={idea} className="ui-btn-secondary px-3" inline />
            <StageAdvanceButton idea={idea} />
            <MoreMenu idea={idea} />
          </div>
        </header>

        <div className="px-4 pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-7 lg:pt-8">
          <IdeaDetailSwipe
            idea={idea}
            editing={editing}
            onEdit={toggleEdit}
            onAi={() => setSide("ai")}
          >
            {editing ? (
              <IdeaEditForm idea={idea} onCancel={() => setEditing(false)} error={editError} />
            ) : (
              <div className="max-w-[760px]">
                <h1 className="idea-title-wrap text-[23px] leading-[1.45] font-medium tracking-[-0.02em] lg:text-[27px]">
                  {idea.title}
                </h1>
                {idea.body.trim() ? (
                  <p className="mt-4 text-[14.5px] leading-[1.95] whitespace-pre-wrap text-secondary">
                    {idea.body}
                  </p>
                ) : null}
                <IdeaTags idea={idea} />
                <p className="mt-4 font-mono text-[11.5px] text-muted-foreground">
                  created {shortAgo(idea.createdAt)} · updated {shortAgo(idea.updatedAt)}
                </p>
              </div>
            )}
          </IdeaDetailSwipe>

          <div className="max-w-[760px]">
            <div className="mt-5 flex gap-2 lg:hidden">
              <StageAdvanceButton idea={idea} className="flex-1" />
              <IdeaCopyButton idea={idea} className="ui-btn-secondary px-4" inline />
            </div>
            <IdeaReviewBand idea={idea} />
            {reviewError ? <p className="mt-1.5 text-[12.5px] text-danger">{reviewError}</p> : null}
            <IdeaComments comments={comments} error={commentError} compact />
            <SelfReview idea={idea} scoreError={scoreError} reflectionError={reflectionError} />
          </div>
        </div>
      </article>

      {/* AI workbench. */}
      <aside
        className={`${side === "ai" ? "flex" : "hidden"} min-h-0 flex-1 flex-col bg-sunken lg:flex lg:border-l lg:border-border`}
        aria-label={t.idea.aiTab}
      >
        <AiWorkbench
          idea={idea}
          tab={tab}
          onTab={setTab}
          discussions={discussions}
          brainstorms={brainstorms}
          researchError={researchError}
          brainstormError={brainstormError}
          evaluateError={evaluateError}
          discussError={discussError}
          premium={premium}
        />
      </aside>
    </div>
  );
}
