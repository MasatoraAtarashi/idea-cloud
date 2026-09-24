/** AI 推し度 in list rows: indigo dot + mono number. Hidden until evaluated. */
export function ListAiScore({ score }: { score?: number | null }) {
  if (score == null) return null;
  return (
    <span className="inline-flex items-center gap-1" title={`推し度 ${score}`}>
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-[#6172f3]" />
      <span className="font-mono text-[12px] font-semibold text-[#3538cd]">{score}</span>
    </span>
  );
}

export function ListCommentCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[11.5px] text-muted-foreground"
      title={`コメント ${count}`}
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
