type MarkProps = {
  className?: string;
};

/** Original mark: geometric cloud + spark. Not Relic / X. */
export function BrandMark({ className = "h-6 w-6" }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        fill="var(--brand)"
        d="M8.4 24.2c-3.4 0-6.15-2.55-6.15-5.7 0-2.7 1.88-5 4.45-5.55C7.15 9.4 10.2 7.2 13.9 7.2c3.1 0 5.82 1.58 7.2 4.02 3.2.28 5.7 2.85 5.7 6.08 0 3.3-2.78 5.9-6.2 5.9H8.4z"
      />
      <path
        fill="var(--brand-spark)"
        d="M24.6 1.6 26.2 6.2 30.8 7.8 26.2 9.4 24.6 14 23 9.4 18.4 7.8 23 6.2z"
      />
    </svg>
  );
}

export function BrandWordmark({ className = "text-[13px] font-semibold tracking-tight" }: MarkProps) {
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
