import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { STAGE_LABEL } from "../../data/mock";
import { summarizeIdeaAnalytics } from "../../lib/analytics";
import { LIST_PATH } from "../../lib/home-path";
import { createDb } from "../../../db/client";
import { listIdeaViews } from "../../../db/ideas";

export function meta() {
  return [{ title: "アナリティクス — アイデアクラウド" }];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const ideas = await listIdeaViews(db);
  return { analytics: summarizeIdeaAnalytics(ideas) };
}

export default function AnalyticsPage() {
  const { analytics } = useLoaderData<typeof loader>();
  const maxStage = Math.max(1, ...analytics.byStage.map((row) => row.count));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <h1 className="ui-title text-[16px]">アナリティクス</h1>
        <Link
          to={LIST_PATH}
          className="text-[13px] text-muted-foreground no-underline hover:text-foreground"
        >
          一覧へ
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          D1のアイデア行から数えた棚の様子です。チャートはまだなく、件数と短い棒だけです。
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="アイデア" value={analytics.total} />
          <Stat label="平均熟成日数" value={formatDays(analytics.averageAgedDays)} />
          <Stat label="中央値" value={formatDays(analytics.medianAgedDays)} />
          <Stat label="振り返りあり" value={analytics.withReflection} />
          <Stat label="人の点数" value={analytics.withHumanScore} />
          <Stat label="AI評価" value={analytics.withAiScore} />
        </dl>

        <section className="mt-8">
          <h2 className="text-[13.5px] font-medium">段階</h2>
          <div className="mt-3 space-y-2">
            {analytics.byStage.map((row) => (
              <div key={row.stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px]">{STAGE_LABEL[row.stage]}</span>
                <div className="h-2 min-w-0 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary/70"
                    style={{ width: `${(row.count / maxStage) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[11.5px] text-muted-foreground">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[13.5px] font-medium">よく使うタグ</h2>
          {analytics.topTags.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">まだタグがありません</p>
          ) : (
            <table className="ui-table mt-3 max-w-md">
              <thead>
                <tr>
                  <th>タグ</th>
                  <th className="text-right">件数</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topTags.map((row) => (
                  <tr key={row.tag}>
                    <td>{row.tag}</td>
                    <td className="text-right font-mono text-[11.5px] text-muted-foreground">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[10px] border border-border bg-card px-3 py-3">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-[18px] font-medium">{value}</dd>
    </div>
  );
}

function formatDays(value: number | null): string {
  return value == null ? "—" : `${value}`;
}
