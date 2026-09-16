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
        <h1 className="font-serif text-3xl">見つかりません</h1>
        <Link to="/app" className="mt-4 inline-block text-sm text-[#7eb8a8]">
          ボードに戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-[#9a958c]">
        <Link to="/app" className="text-[#7eb8a8] no-underline hover:underline">
          熟成ボード
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <h1 className="mt-3 font-serif text-3xl leading-snug md:text-4xl">{idea.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#9a958c]">
        <span>{idea.author}</span>
        <span>·</span>
        <span>{idea.agedDays}日寝かせた</span>
        <span>·</span>
        <span>{idea.createdAt}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {idea.tags.map((tag) => (
          <StagePill key={tag} label={tag} />
        ))}
        <StagePill label="AIタグ（スタブ）" />
      </div>
      <p className="mt-8 text-base leading-relaxed text-[#e8e6e1]/90">{idea.body}</p>
      <section className="mt-10 grid gap-3 sm:grid-cols-4">
        {[
          ["進める", "/app/research"],
          ["融合する", "/app/merge"],
          ["アーカイブ", "/app"],
          ["捨てる", "/app"],
        ].map(([label, href]) => (
          <Link
            key={label}
            to={href}
            className="rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-center text-sm no-underline hover:border-[#d4a574]/40"
          >
            {label}
          </Link>
        ))}
      </section>
      {idea.relatedIds.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-[#9a958c]">関連（モック）</h2>
          <ul className="mt-3 space-y-2">
            {idea.relatedIds.map((id) => {
              const related = getIdea(id);
              if (!related) return null;
              return (
                <li key={id}>
                  <Link
                    to={`/app/ideas/${related.id}`}
                    className="text-sm text-[#7eb8a8] no-underline hover:underline"
                  >
                    {related.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <p className="mt-10 text-xs text-[#9a958c]">
        本文は将来 FIELD_ENCRYPTION_KEY で AES-GCM 暗号化して D1
        に置く想定です。いまは平文のモックです。
      </p>
    </article>
  );
}
