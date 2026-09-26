import { useState, type ReactNode } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { STAGE_LABEL, tagPillStyle } from "../../data/mock";
import {
  createdBarTone,
  createdDayLabel,
  summarizeIdeaAnalytics,
  type CreatedBarTone,
  type CreatedDayCount,
} from "../../lib/analytics";
import { STAGE_PILL_HEX } from "../../lib/tokens";
import { listIdeaViews } from "../../../db/ideas";
import { SettingsIconLink } from "../../components/settings-link";
import { MobileScreenHeader } from "../../components/mobile-header";
import { appDb } from "../../lib/app-db";

export function meta() {
  return [{ title: "アナリティクス — アイデアクラウド" }];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = appDb(context);
  const ideas = await listIdeaViews(db);
  return { analytics: summarizeIdeaAnalytics(ideas) };
}

const BAR_FILL: Record<CreatedBarTone, string> = {
  today: "#101828",
  normal: "#d0d5dd",
  low: "#e4e7ec",
  empty: "#e4e7ec",
};

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13.5px] font-semibold text-foreground">{title}</h2>
        {trailing}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { analytics } = useLoaderData<typeof loader>();
  const [span, setSpan] = useState<7 | 30>(7);
  const createdRows = span === 7 ? analytics.createdByDay7 : analytics.createdByDay30;
  const stageRows = analytics.byStage;
  const stageTotal = stageRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="hidden shrink-0 items-baseline gap-2.5 border-b border-border bg-card px-7 py-[18px] md:flex">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">
          アナリティクス
        </h1>
        <span className="font-mono text-[12px] text-muted-foreground">last 30d</span>
      </header>
      <MobileScreenHeader
        title={
          <div className="flex items-baseline gap-2 px-1">
            <h1 className="text-[18px] font-semibold text-foreground">アナリティクス</h1>
            <span className="font-mono text-[11.5px] text-muted-foreground">last 30d</span>
          </div>
        }
        trailing={<SettingsIconLink />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-7 md:py-[22px]">
        <dl className="grid max-w-[960px] grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="アイデア総数" value={analytics.total} />
          <Stat
            label="平均熟成日数"
            value={analytics.averageAgedDays ?? "—"}
            unit={analytics.averageAgedDays == null ? undefined : "d"}
          />
          <Stat label="AI評価済" value={analytics.withAiScore} />
          <Stat label="試した" value={analytics.tried} />
        </dl>

        <div className="max-w-[960px]">
          <Section title="段階の分布">
            <div
              className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px] bg-muted"
              role="img"
              aria-label={stageRows
                .map((row) => `${STAGE_LABEL[row.stage]} ${row.count}`)
                .join("、")}
            >
              {stageTotal > 0
                ? stageRows
                    .filter((row) => row.count > 0)
                    .map((row) => (
                      <span
                        key={row.stage}
                        className="h-full"
                        style={{
                          flexGrow: row.count,
                          flexBasis: 0,
                          background: STAGE_PILL_HEX[row.stage].dot,
                        }}
                      />
                    ))
                : null}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {stageRows.map((row) => (
                <li
                  key={row.stage}
                  className="flex items-center gap-1.5 text-[12.5px] text-tertiary"
                >
                  <span
                    aria-hidden="true"
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: STAGE_PILL_HEX[row.stage].dot }}
                  />
                  {STAGE_LABEL[row.stage]}
                  <span className="font-mono text-[12px] font-medium text-secondary">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="1日あたりの着想"
            trailing={
              <div className="flex rounded-[7px] border border-border-control bg-card p-0.5">
                {([7, 30] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSpan(value)}
                    aria-pressed={span === value}
                    className={`flex min-h-11 items-center rounded-[5px] px-3 font-mono text-[11.5px] md:min-h-0 md:px-2.5 md:py-1 ${
                      span === value
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {value}d
                  </button>
                ))}
              </div>
            }
          >
            <CreatedBars rows={createdRows} span={span} />
          </Section>

          <Section title="よく出るタグ">
            {analytics.topTags.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">まだタグがありません</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {analytics.topTags.map((row) => (
                  <li
                    key={row.tag}
                    className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium"
                    style={tagPillStyle(row.tag)}
                  >
                    {row.tag}
                    <span className="font-mono text-[12px] font-semibold">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function CreatedBars({ rows, span }: { rows: CreatedDayCount[]; span: number }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  const dense = rows.length > 7;
  return (
    <div className={`flex items-end ${dense ? "gap-[3px]" : "gap-2 md:gap-3"}`}>
      {rows.map((row, index) => {
        const isToday = index === rows.length - 1;
        const tone = createdBarTone(row.count, max, isToday);
        const height = row.count > 0 ? Math.max(8, (row.count / max) * 100) : 0;
        const label = createdDayLabel(row.day, isToday, span);
        const showLabel = !dense || isToday || index % 5 === 0;
        return (
          <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-[120px] w-full items-end" title={`${row.day}: ${row.count}件`}>
              <div
                className="w-full rounded-[3px]"
                style={{
                  height: tone === "empty" ? 2 : `${height}%`,
                  background: BAR_FILL[tone],
                }}
              />
            </div>
            <span
              className={`font-mono text-[10.5px] tracking-[0.06em] ${
                isToday ? "font-semibold text-foreground" : "text-muted-foreground"
              } ${showLabel ? "" : "invisible"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="rounded-[10px] border border-border-card bg-card px-4 py-3.5">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-mono text-[25px] leading-none font-semibold tracking-[-0.02em] text-foreground">
        {value}
        {unit ? (
          <span className="ml-0.5 text-[13px] font-medium text-muted-foreground">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}
