import { BrandMark } from "../brand";
import { useT } from "../../i18n/context";

/**
 * The product shot in the hero. Real DOM rather than a PNG: it stays sharp on
 * any display, weighs nothing to download, and — unlike a screenshot — it is in
 * the reader's language. Staged content, not live data.
 */

const STAGE_CLASS: Record<string, string> = {
  spark: "stage-spark",
  aging: "stage-aging",
  ripe: "stage-ripe",
  selected: "stage-selected",
  archived: "stage-archived",
};

function stageClass(stage: string): string {
  return STAGE_CLASS[stage] ?? STAGE_CLASS.spark;
}

function WindowDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
      <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
      <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
    </span>
  );
}

function SideItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[11.5px] ${
        active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-border-control"}`}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** A labelled 0–100 bar, the same shape the evaluation panel uses in the app. */
function AxisBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[5.6em] shrink-0 truncate text-[10.5px] text-muted-foreground">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${value}%` }}
          aria-hidden="true"
        />
      </span>
      <span className="w-[2em] shrink-0 text-right font-mono text-[10.5px] text-secondary">
        {value}
      </span>
    </div>
  );
}

export function AppPreview() {
  const t = useT();
  const p = t.lp.preview;

  return (
    <div
      className="lp-shot overflow-hidden rounded-[14px] border border-white/12 bg-card"
      role="img"
      aria-label={t.lp.metaTitle}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-sunken px-3.5 py-2.5">
        <WindowDots />
        <span className="mx-auto hidden min-w-0 max-w-[260px] flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-border bg-card px-2 py-1 text-[10.5px] text-muted-foreground sm:flex">
          <span className="truncate">idea-cloud.app</span>
        </span>
        <span className="w-[54px] shrink-0" aria-hidden="true" />
      </div>

      <div className="flex min-h-[300px]">
        {/* Sidebar */}
        <div className="hidden w-[168px] shrink-0 flex-col gap-1 border-r border-border bg-sidebar p-2.5 sm:flex">
          <span className="mb-2 flex items-center gap-1.5 px-2 pt-1">
            <BrandMark className="h-4 w-4" />
            <span className="truncate text-[11.5px] font-semibold">{t.common.appName}</span>
          </span>
          <SideItem label={p.nav.ideas} active />
          <SideItem label={p.nav.inspiration} />
          <SideItem label={p.nav.analytics} />
        </div>

        {/* List */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
            <span className="flex h-6 min-w-0 flex-1 items-center rounded-[6px] border border-border bg-sunken px-2 text-[10.5px] text-muted-foreground">
              {p.search}
            </span>
            <span className="stage-pill stage-ripe shrink-0 text-[10.5px]">{p.filter}</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-border bg-table-head px-3.5 py-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
            <span className="truncate">{p.columns.idea}</span>
            <span className="truncate">{p.columns.stage}</span>
            <span className="truncate text-right">{p.columns.updated}</span>
          </div>

          <ul className="divide-y divide-border">
            {p.rows.map((row) => (
              <li
                key={row.title}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3.5 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-foreground">{row.title}</span>
                </span>
                <span className={`stage-pill ${stageClass(row.stage)} shrink-0 text-[10.5px]`}>
                  {t.common.stage[row.stage as keyof typeof t.common.stage] ?? row.stage}
                </span>
                <span className="shrink-0 text-right font-mono text-[10.5px] whitespace-nowrap text-muted-foreground">
                  {row.updated}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI panel */}
        <div className="hidden w-[208px] shrink-0 flex-col gap-3 border-l border-border bg-sunken p-3.5 lg:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[11px] font-semibold">{p.ai.title}</span>
          </span>
          <div className="flex flex-col gap-2">
            {p.ai.axes.map((axis) => (
              <AxisBar key={axis.label} label={axis.label} value={axis.value} />
            ))}
          </div>
          <div className="rounded-[8px] border border-border bg-card p-2.5">
            <span className="block text-[10px] text-muted-foreground">{p.ai.verdictLabel}</span>
            <span className="mt-0.5 block text-[12px] font-semibold text-accent">
              {p.ai.verdict}
            </span>
          </div>
          <div className="rounded-[8px] border border-border bg-card p-2.5">
            <span className="block text-[10px] text-muted-foreground">{p.ai.nextLabel}</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-secondary">
              {p.ai.next}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
