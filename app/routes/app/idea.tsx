import { Link, useParams } from "react-router";
import { EMPTY_DETAIL_BODY, EMPTY_DETAIL_TITLE, getIdea } from "../../data/mock";
import { PageHeader, StageChip, TagChip } from "../../components/ui";

export function meta() {
  return [{ title: "アイデア詳細 — アイデアクラウド" }];
}

export default function IdeaPage() {
  const { ideaId } = useParams();
  const idea = getIdea(ideaId);

  if (!idea) {
    return (
      <div className="ui-panel p-6">
        <PageHeader title={EMPTY_DETAIL_TITLE} description={EMPTY_DETAIL_BODY} />
        <Link
          to="/app"
          className="text-sm text-muted-foreground no-underline hover:text-foreground"
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
          アイデア
        </Link>
        <span className="mx-2">/</span>
        {idea.title}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StageChip stage={idea.stage} />
        {idea.author ? <span>{idea.author}</span> : null}
        <span>{idea.agedDays}日寝かせた</span>
        <span>{idea.createdAt}</span>
      </div>
      {idea.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      ) : null}
      <div className="ui-panel mt-6 p-4">
        <p className="text-sm leading-relaxed text-foreground">{idea.body}</p>
      </div>
      <section className="mt-4 grid gap-2 sm:grid-cols-4">
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
