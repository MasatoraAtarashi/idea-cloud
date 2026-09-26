import type { ReactNode } from "react";
import { STAGE_PILL_CLASS, tagPillStyle, type Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { STAGE_PILL_HEX } from "../lib/tokens";

export function PageHeader({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <div className="mt-1 text-muted-foreground">{icon}</div> : null}
        <div className="min-w-0">
          <h1 className="ui-title text-[16px]">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="ui-title text-[15px]">{title}</p>
      {body ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StagePill({ stage }: { stage: Stage }) {
  const t = useT();
  return <span className={`stage-pill ${STAGE_PILL_CLASS[stage]}`}>{t.common.stage[stage]}</span>;
}

export function StageDot({ stage, size = 6 }: { stage: Stage; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: STAGE_PILL_HEX[stage].dot }}
    />
  );
}

/** Square-ish chip so tags never read as stage pills. */
export function TagPill({ label, large = false }: { label: string; large?: boolean }) {
  return (
    <span
      className={`tag-chip ${large ? "px-[9px] py-[3px] text-[12px]" : ""}`}
      style={tagPillStyle(label)}
    >
      {label}
    </span>
  );
}

export function TagList({
  tags,
  emptyLabel,
  limit = 3,
  nowrap = false,
}: {
  tags: string[];
  /** Defaults to the "no auto tags" copy; pass `""` to render nothing. */
  emptyLabel?: string;
  limit?: number;
  nowrap?: boolean;
}) {
  const t = useT();
  emptyLabel = emptyLabel ?? t.common.autoTagsNone;
  if (tags.length === 0) {
    return emptyLabel ? (
      <span className="text-[11.5px] text-muted-foreground">{emptyLabel}</span>
    ) : null;
  }
  const shown = tags.slice(0, limit);
  const extra = tags.length - shown.length;
  return (
    <div
      className={`flex items-center gap-1.5 ${nowrap ? "flex-nowrap overflow-hidden" : "flex-wrap"}`}
    >
      {shown.map((tag) => (
        <TagPill key={tag} label={tag} />
      ))}
      {extra > 0 ? (
        <span className="font-mono text-[11px] text-muted-foreground">+{extra}</span>
      ) : null}
    </div>
  );
}

export function CountBadge({ value }: { value: number }) {
  return <span className="font-mono text-[12px] font-normal text-muted-foreground">{value}</span>;
}
