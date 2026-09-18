import { Form, Link, useFetcher, useNavigation } from "react-router";
import { STAGE_LABEL, STAGES, type MockIdea, type Stage } from "../data/mock";
import { canRunIdeaAi } from "../lib/idea-ai";
import { LIST_PATH } from "../lib/home-path";
import { isBrainstormSubmitting } from "./idea-brainstorm";
import { isResearchSubmitting } from "./idea-research";
import { IconMore } from "./icons";

export function IdeaActionsMenu({ idea }: { idea: MockIdea }) {
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const aiReady = canRunIdeaAi(idea.stage);
  const actionOnThisIdea = (navigation.formAction ?? "").includes(`/app/ideas/${idea.id}`);
  const researching =
    navigation.state !== "idle" && isResearchSubmitting(navigation.formData) && actionOnThisIdea;
  const brainstorming =
    navigation.state !== "idle" && isBrainstormSubmitting(navigation.formData) && actionOnThisIdea;

  function setStage(stage: Stage) {
    const data = new FormData();
    data.set("intent", "stage");
    data.set("stage", stage);
    data.set("redirectTo", LIST_PATH);
    void fetcher.submit(data, { method: "post", action: `/app/ideas/${idea.id}` });
  }

  return (
    <details className="ui-menu relative" name="idea-actions">
      <summary
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="操作"
      >
        <IconMore className="h-4 w-4" />
      </summary>
      <div className="ui-float absolute right-0 z-20 mt-1 w-52 py-1">
        <Link
          to={`/app/ideas/${idea.id}`}
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          詳細を開く
        </Link>
        {aiReady ? (
          <>
            <Form method="post" action={`/app/ideas/${idea.id}`}>
              <input type="hidden" name="intent" value="research" />
              <button
                type="submit"
                disabled={researching}
                className="block w-full px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-row-hover disabled:text-muted-foreground"
              >
                {researching ? "実行中…" : "リサーチを実行"}
              </button>
            </Form>
            <Form method="post" action={`/app/ideas/${idea.id}`}>
              <input type="hidden" name="intent" value="brainstorm" />
              <button
                type="submit"
                disabled={brainstorming}
                className="block w-full px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-row-hover disabled:text-muted-foreground"
              >
                {brainstorming ? "実行中…" : "ブレスト"}
              </button>
            </Form>
          </>
        ) : (
          <p className="cursor-not-allowed px-3 py-1.5 text-[13px] text-muted-foreground">
            リサーチ / ブレスト
            <span className="mt-0.5 block text-[11px] leading-snug">
              アーカイブでは実行できません
            </span>
          </p>
        )}
        <div className="border-t border-border my-1" />
        <p className="px-3 py-1 font-mono text-[11px] text-muted-foreground">段階を変更</p>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStage(stage)}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-row-hover"
          >
            {STAGE_LABEL[stage]}
          </button>
        ))}
        <div className="border-t border-border my-1" />
        <Link
          to={`/app/merge?from=${idea.id}`}
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          他のアイデアと融合
        </Link>
        <div className="border-t border-border my-1" />
        <button
          type="button"
          onClick={() => setStage("archived")}
          className="block w-full px-3 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-row-hover"
        >
          アーカイブへ移す
        </button>
      </div>
    </details>
  );
}
