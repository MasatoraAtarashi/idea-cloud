import { useT } from "../i18n/context";

/** AI score in list rows: indigo dot + mono number. Hidden until evaluated. */
export function ListAiScore({ score }: { score?: number | null }) {
  const t = useT();
  if (score == null) return null;
  return (
    <span className="inline-flex items-center gap-1" title={t.list.meta.aiScore(score)}>
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-[#6172f3]" />
      <span className="font-mono text-[12px] font-semibold text-[#3538cd]">{score}</span>
    </span>
  );
}

export function ListCommentCount({ count }: { count: number }) {
  const t = useT();
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[11.5px] text-muted-foreground"
      title={t.list.meta.comments(count)}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
        <path
          d="M3 3.5h10v7H7l-3 2.5v-2.5H3z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      {count}
    </span>
  );
}
