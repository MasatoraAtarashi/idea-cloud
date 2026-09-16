import { Link, useParams } from "react-router";
import { getIdea, STAGE_LABEL } from "../../data/mock";
import { StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "アイデア詳細 — アイデアクラウド" }];
}

export default function IdeaPage() {
  const { ideaId } = useParams();
  const idea = getIdea(ideaId);

  if (!idea) {
    return (
      <div>
        <h1 className="text-xl font-semibold">見つかりません</h1>
        <Link
          to="/app"
          className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ボードに戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground">
        <Link to="/app" className="text-foreground no-underline hover:underline">
          熟成ボード
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">{idea.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{idea.author}</span>
        <span>·</span>
        <span>{idea.agedDays}日寝かせた</span>
        <span>·</span>
        <span>{idea.createdAt}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {idea.tags.map((tag) => (
          <StagePill key={tag} label={tag} />
        ))}
        <StagePill label="AIタグ（スタブ）" />
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
      {idea.relatedIds.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-medium text-muted-foreground">関連（モック）</h2>
          <ul className="mt-2 space-y-1.5">
            {idea.relatedIds.map((id) => {
              const related = getIdea(id);
              if (!related) return null;
              return (
                <li key={id}>
                  <Link
                    to={`/app/ideas/${related.id}`}
                    className="text-sm text-foreground no-underline hover:underline"
                  >
                    {related.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        本文は将来 FIELD_ENCRYPTION_KEY で AES-GCM 暗号化して D1
        に置く想定です。いまは平文のモックです。
      </p>
    </article>
  );
}
