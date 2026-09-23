import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { STAGE_LABEL } from "../../data/mock";
import { summarizeIdeaAnalytics, type CreatedDayCount } from "../../lib/analytics";
import { createDb } from "../../../db/client";
import { listIdeaViews } from "../../../db/ideas";
import { SettingsIconLink } from "../../components/settings-link";
import { MobileScreenHeader } from "../../components/mobile-header";

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
  const [span, setSpan] = useState<7 | 30>(7);
  const maxStage = Math.max(1, ...analytics.byStage.map((row) => row.count));
  const createdRows = span === 7 ? analytics.createdByDay7 : analytics.createdByDay30;
  const createdTotal = span === 7 ? analytics.createdLast7 : analytics.createdLast30;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="hidden h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border px-4 md:flex">
        <h1 className="ui-title text-[16px]">アナリティクス</h1>
      </header>
      <MobileScreenHeader
        title={<h1 className="ui-title truncate text-[15px]">アナリティクス</h1>}
        trailing={<SettingsIconLink />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8 md:pb-5">
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-foreground">
          D1のアイデア行から数えた棚の様子です。チャートはまだなく、件数と短い棒だけです。
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="アイデア" value={analytics.total} />
          <Stat label="直近7日の作成" value={analytics.createdLast7} />
          <Stat label="直近30日の作成" value={analytics.createdLast30} />
          <Stat label="平均熟成日数" value={formatDays(analytics.averageAgedDays)} />
          <Stat label="中央値" value={formatDays(analytics.medianAgedDays)} />
          <Stat label="振り返りあり" value={analytics.withReflection} />
          <Stat label="人の点数" value={analytics.withHumanScore} />
          <Stat label="AI評価" value={analytics.withAiScore} />
        </dl>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-semibold">日別の作成</h2>
            <div className="flex rounded-md border border-border-control p-0.5">
              <button
                type="button"
                onClick={() => setSpan(7)}
                className={`flex min-h-11 items-center rounded-sm px-3 text-[13px] md:min-h-0 md:px-2.5 md:py-1 md:text-[12.5px] ${
                  span === 7 ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                7日
              </button>
              <button
                type="button"
                onClick={() => setSpan(30)}
                className={`flex min-h-11 items-center rounded-sm px-3 text-[13px] md:min-h-0 md:px-2.5 md:py-1 md:text-[12.5px] ${
                  span === 30 ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                30日
              </button>
            </div>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {span}日間で {createdTotal} 件
          </p>
          <CreatedBars rows={createdRows} />
        </section>

        <section className="mt-8">
          <h2 className="text-[13.5px] font-semibold">段階</h2>
          <div className="mt-3 space-y-2">
            {analytics.byStage.map((row) => (
              <div key={row.stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] text-foreground">
                  {STAGE_LABEL[row.stage]}
                </span>
                <div className="h-2 min-w-0 flex-1 rounded-full border border-border bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
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
          <h2 className="text-[13.5px] font-semibold">よく使うタグ</h2>
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

function CreatedBars({ rows }: { rows: CreatedDayCount[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="mt-3 flex items-end gap-1 overflow-x-auto border border-border bg-card px-2 py-3">
      {rows.map((row) => (
        <div key={row.day} className="flex min-w-[1.15rem] flex-1 flex-col items-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">{row.count}</span>
          <div className="flex h-24 w-full items-end rounded-sm bg-muted">
            <div
              className="w-full rounded-sm bg-primary/80"
              style={{ height: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{row.day.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[10px] border border-border bg-card px-3 py-3">
      <dt className="text-[12px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-[20px] font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function formatDays(value: number | null): string {
  return value == null ? "—" : `${value}`;
}
