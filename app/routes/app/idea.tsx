import { Link, useParams } from "react-router";
import { getIdea, STAGE_LABEL } from "../../data/mock";
import { EmptyState, PageHeader, StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "アイデア詳細 — アイデアクラウド" }];
}

export default function IdeaPage() {
  const { ideaId } = useParams();
  const idea = getIdea(ideaId);

  if (!idea) {
    return (
      <div>
        <PageHeader title="アイデア詳細" description="まだこのアイデアはない。" />
        <div className="ui-panel">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/app" className="text-foreground no-underline hover:underline">
          アイデア
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{idea.agedDays}日寝かせた</span>
        <span>·</span>
        <span>{idea.createdAt}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {idea.tags.map((tag) => (
          <StagePill key={tag} label={tag} />
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
