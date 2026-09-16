import type { ReactNode } from "react";
import { STAGE_LABEL, type Stage } from "../data/mock";

const STAGE_CHIP: Record<Stage, string> = {
  spark: "bg-[#fce7f3] text-[#be185d]",
  aging: "bg-[#ffedd5] text-[#c2410c]",
  ripe: "bg-[#dcfce7] text-[#15803d]",
  selected: "bg-[#dbeafe] text-[#1d4ed8]",
  archived: "bg-[#f4f4f5] text-[#52525b]",
};

export function StageChip({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-2 text-[11px] font-semibold ${STAGE_CHIP[stage]}`}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground">
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-5 border-b border-border">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`-mb-px border-b-2 pb-2 text-sm ${
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
