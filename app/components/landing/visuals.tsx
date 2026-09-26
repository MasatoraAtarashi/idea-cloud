import type { Stage } from "../../data/mock";
import { useT } from "../../i18n/context";

/**
 * Small abstractions of each screen, for the feature grid. They carry no copy
 * so they need no translation, and they use the same tokens as the app so the
 * landing page cannot drift from the product's palette.
 */

const FRAME = "h-[104px] w-full rounded-[10px] border border-border bg-sunken p-3";

function Bar({ w, tone = "muted" }: { w: string; tone?: "muted" | "accent" | "soft" }) {
  const bg =
    tone === "accent" ? "bg-accent" : tone === "soft" ? "bg-brand-spark" : "bg-border-control";
  return <span className={`block h-1.5 rounded-full ${bg}`} style={{ width: w }} />;
}

/** AI evaluation: three axes filling up. */
function EvaluateArt() {
  return (
    <div className={`${FRAME} flex flex-col justify-center gap-2.5`} aria-hidden="true">
      {[76, 88, 58].map((value, index) => (
        <span key={value} className="flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className={
                index === 1
                  ? "block h-full rounded-full bg-accent"
                  : "block h-full rounded-full bg-brand-spark"
              }
              style={{ width: `${value}%` }}
            />
          </span>
          <span className="w-[1.8em] text-right font-mono text-[9.5px] text-muted-foreground">
            {value}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Research: results stacked under a query line. */
function ResearchArt() {
  return (
    <div className={`${FRAME} flex flex-col gap-2`} aria-hidden="true">
      <span className="flex items-center gap-1.5 rounded-[6px] border border-border bg-card px-2 py-1">
        <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0">
          <circle cx="7" cy="7" r="4.4" fill="none" stroke="var(--grey-dot)" strokeWidth="1.5" />
          <path
            d="M10.4 10.4 14 14"
            stroke="var(--grey-dot)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <Bar w="58%" />
      </span>
      <span className="flex flex-col gap-1.5 rounded-[6px] border border-border bg-card px-2 py-1.5">
        <Bar w="82%" tone="soft" />
        <Bar w="46%" />
      </span>
      <span className="flex flex-col gap-1.5 rounded-[6px] border border-border bg-card px-2 py-1.5">
        <Bar w="66%" tone="soft" />
      </span>
    </div>
  );
}

/** Brainstorm: one node branching into three. */
function BrainstormArt() {
  return (
    <div className={FRAME} aria-hidden="true">
      <svg viewBox="0 0 160 76" className="h-full w-full">
        <path
          d="M34 38h20M54 38c10 0 8-24 20-24M54 38h22M54 38c10 0 8 24 20 24"
          fill="none"
          stroke="var(--border-control)"
          strokeWidth="1.5"
        />
        <rect x="6" y="30" width="28" height="16" rx="5" fill="var(--accent)" />
        <rect
          x="76"
          y="6"
          width="56"
          height="16"
          rx="5"
          fill="var(--card)"
          stroke="var(--border-control)"
        />
        <rect
          x="76"
          y="30"
          width="72"
          height="16"
          rx="5"
          fill="var(--card)"
          stroke="var(--border-control)"
        />
        <rect
          x="76"
          y="54"
          width="46"
          height="16"
          rx="5"
          fill="var(--card)"
          stroke="var(--border-control)"
        />
      </svg>
    </div>
  );
}

/** Discuss: a two-turn thread. */
function DiscussArt() {
  return (
    <div className={`${FRAME} flex flex-col justify-center gap-2`} aria-hidden="true">
      <span className="flex flex-col gap-1.5 self-start rounded-[8px] rounded-bl-[2px] border border-border bg-card px-2.5 py-2">
        <Bar w="72px" />
        <Bar w="48px" />
      </span>
      <span className="flex flex-col gap-1.5 self-end rounded-[8px] rounded-br-[2px] bg-accent/10 px-2.5 py-2">
        <Bar w="88px" tone="accent" />
        <Bar w="56px" tone="soft" />
      </span>
    </div>
  );
}

/** Inspiration: a small tile wall. */
function InspirationArt() {
  return (
    <div className={`${FRAME} grid grid-cols-3 grid-rows-2 gap-2`} aria-hidden="true">
      <span className="col-span-2 row-span-2 rounded-[6px] bg-gradient-to-br from-brand-spark to-accent opacity-80" />
      <span className="rounded-[6px] border border-border bg-card" />
      <span className="rounded-[6px] bg-muted" />
    </div>
  );
}

/** Analytics: captures stacking up week over week. */
function AnalyticsArt() {
  return (
    <div className={`${FRAME} flex items-end gap-1.5`} aria-hidden="true">
      {[28, 44, 36, 58, 50, 72, 88].map((height, index) => (
        <span
          key={height}
          className={`flex-1 rounded-t-[3px] ${index >= 5 ? "bg-accent" : "bg-border-control"}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

/** Ordered to match `lp.features.items`. */
export const FEATURE_ART = [
  EvaluateArt,
  ResearchArt,
  BrainstormArt,
  DiscussArt,
  InspirationArt,
  AnalyticsArt,
];

const STAGE_ORDER: Stage[] = ["spark", "aging", "ripe", "selected", "archived"];
const STAGE_DOT: Record<Stage, string> = {
  spark: "var(--stage-spark-dot)",
  aging: "var(--stage-aging-dot)",
  ripe: "var(--stage-ripe-dot)",
  selected: "var(--stage-selected-dot)",
  archived: "var(--stage-archived-dot)",
};

/**
 * The five stages as one rail, so the eye reads them as time passing rather
 * than as five unrelated cards.
 */
export function StageRail() {
  const t = useT();
  const items = t.lp.stages.items;

  return (
    <ol className="mt-10 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
      {STAGE_ORDER.map((stage, index) => (
        <li key={stage} className="relative list-none">
          {/* The rail runs between dots, so it stops at the last one. */}
          {index < STAGE_ORDER.length - 1 ? (
            <span
              className="absolute top-[5px] left-0 hidden h-px w-[calc(100%+16px)] bg-border-control lg:block"
              aria-hidden="true"
            />
          ) : null}
          <span
            className="relative z-[1] block h-[11px] w-[11px] rounded-full ring-4 ring-background"
            style={{ background: STAGE_DOT[stage] }}
            aria-hidden="true"
          />
          <p className="ui-title mt-4 text-[14.5px] font-semibold">{items[index]?.label}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {items[index]?.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
