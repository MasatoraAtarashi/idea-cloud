import type { ReactNode } from "react";
import { STAGE_LABEL, STAGE_PILL_CLASS, tagPillClass, type Stage } from "../data/mock";

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
  return <span className={`stage-pill ${STAGE_PILL_CLASS[stage]}`}>{STAGE_LABEL[stage]}</span>;
}

export function TagPill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tagPillClass(label)}`}
    >
      {label}
    </span>
  );
}

export function TagList({
  tags,
  emptyLabel = "自動タグなし",
  limit = 3,
}: {
  tags: string[];
  emptyLabel?: string;
  limit?: number;
}) {
  if (tags.length === 0) {
    return <span className="text-[11px] text-muted-foreground">{emptyLabel}</span>;
  }
  const shown = tags.slice(0, limit);
  const extra = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
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
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
      {value}
    </span>
  );
}
