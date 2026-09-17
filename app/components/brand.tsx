type MarkProps = {
  className?: string;
};

/** Original mark: geometric cloud + spark. Not Relic / X. */
export function BrandMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        fill="var(--brand)"
        d="M9.2 22.5c-3.15 0-5.7-2.42-5.7-5.4 0-2.58 1.78-4.76 4.22-5.28C8.2 8.58 11.05 6.5 14.4 6.5c2.92 0 5.48 1.52 6.78 3.78 3.05.28 5.42 2.72 5.42 5.72 0 3.16-2.64 5.5-5.9 5.5H9.2z"
      />
      <path
        fill="var(--brand-spark)"
        d="M24.2 3.2 25.05 6.1 28 6.95 25.05 7.8 24.2 10.7 23.35 7.8 20.4 6.95 23.35 6.1z"
      />
      <circle cx="14.6" cy="15.6" r="1.35" fill="var(--brand-spark)" />
    </svg>
  );
}

export function BrandWordmark({ className = "text-[13px] font-medium tracking-tight" }: MarkProps) {
  return <span className={className}>アイデアクラウド</span>;
}

export function Brand({
  compact = false,
  wordmarkClassName,
}: {
  compact?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <BrandMark className={compact ? "h-5 w-5 shrink-0" : "h-6 w-6 shrink-0"} />
      <BrandWordmark className={wordmarkClassName} />
    </span>
  );
}
