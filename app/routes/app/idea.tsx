import { Link, useParams } from "react-router";
import { IconList } from "../../components/icons";
import { EmptyState, PageHeader, StagePill, TagPill } from "../../components/ui";
import { getIdea, STAGE_LABEL } from "../../data/mock";

export function meta() {
  return [{ title: "アイデア詳細 — アイデアクラウド" }];
}

export default function IdeaPage() {
  const { ideaId } = useParams();
  const idea = getIdea(ideaId);

  if (!idea) {
    return (
      <div>
        <PageHeader
          icon={<IconList className="h-5 w-5" />}
          title="アイデア詳細"
          description="指定された着想はありません。"
        />
        <div className="ui-panel">
          <EmptyState
            title="見つかりません"
            body="アイデアはまだありません。一覧に戻ってキャプチャから置いてください。"
          />
        </div>
        <Link
          to="/app"
          className="mt-4 inline-block text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/app" className="text-foreground no-underline hover:underline">
          アイデア一覧
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{idea.agedDays}日寝かせた</span>
        <span>·</span>
        <span>{idea.createdAt}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StagePill stage={idea.stage} />
        {idea.tags.map((tag) => (
          <TagPill key={tag} label={tag} />
        ))}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-foreground">{idea.body}</p>
      <section className="mt-8 grid gap-2 sm:grid-cols-4">
        {[
          ["進める", "/app/research"],
          ["融合する", "/app/merge"],
          ["アーカイブ", "/app"],
          ["捨てる", "/app"],
        ].map(([label, href]) => (
          <Link key={label} to={href} className="ui-btn-ghost px-3 py-2 text-center text-sm">
            {label}
          </Link>
        ))}
      </section>
    </article>
  );
}
