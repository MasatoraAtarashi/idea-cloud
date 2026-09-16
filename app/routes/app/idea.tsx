import { Link, useParams } from "react-router";
import { getIdea, STAGE_LABEL } from "../../data/mock";
import { PageHeader, StagePill } from "../../components/shell";

export function meta() {
  return [{ title: "アイデア詳細 — アイデアクラウド" }];
}

export default function IdeaPage() {
  const { ideaId } = useParams();
  const idea = getIdea(ideaId);

  if (!idea) {
    return (
      <div>
        <PageHeader title="見つかりません" />
        <Link to="/app" className="ui-link text-muted-foreground hover:text-foreground">
          ボードに戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <p className="mb-3 text-xs text-muted-foreground">
        <Link to="/app" className="text-foreground no-underline hover:underline">
          熟成ボード
        </Link>
        <span className="mx-2">/</span>
        {STAGE_LABEL[idea.stage]}
      </p>
      <PageHeader title={idea.title} />
      <div className="ui-panel overflow-hidden">
        <table className="ui-table">
          <tbody>
            <tr>
              <td className="w-28 text-muted-foreground">作者</td>
              <td>{idea.author}</td>
            </tr>
            <tr>
              <td className="text-muted-foreground">寝かせた日数</td>
              <td>{idea.agedDays}日</td>
            </tr>
            <tr>
              <td className="text-muted-foreground">作成</td>
              <td>{idea.createdAt}</td>
            </tr>
            <tr>
              <td className="text-muted-foreground">タグ</td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {idea.tags.map((tag) => (
                    <StagePill key={tag} label={tag} />
                  ))}
                  <StagePill label="AIタグ（スタブ）" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
        <section className="ui-panel mt-8 overflow-hidden">
          <div className="border-b border-border bg-secondary px-4 py-2.5">
            <h2 className="text-sm font-medium">関連（モック）</h2>
          </div>
          <table className="ui-table">
            <tbody>
              {idea.relatedIds.map((id) => {
                const related = getIdea(id);
                if (!related) return null;
                return (
                  <tr key={id}>
                    <td>
                      <Link
                        to={`/app/ideas/${related.id}`}
                        className="text-sm text-foreground no-underline hover:underline"
                      >
                        {related.title}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        本文は将来 FIELD_ENCRYPTION_KEY で AES-GCM 暗号化して D1
        に置く想定です。いまは平文のモックです。
      </p>
    </article>
  );
}
