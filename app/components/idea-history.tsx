import type { IdeaHistoryItem } from "../lib/idea-history";
import { formatDateJa } from "../lib/format";
import { ResearchSourcesList } from "./idea-research";

export function IdeaHistory({ items }: { items: IdeaHistoryItem[] }) {
  return (
    <section className="idea-history max-w-2xl">
      <h2 className="text-[15px] font-semibold lg:text-[16px]">履歴</h2>
      <p id="brainstorm" className="mt-1 text-[12.5px] text-muted-foreground">
        リサーチ・ブレスト・AI評価の記録です。ブレストは毎回残します。リサーチとAI評価は最新のみです。
      </p>
      <span id="evaluate" className="sr-only">
        AI評価
      </span>
      {items.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-muted-foreground">まだ履歴はありません。</p>
      ) : (
        <ol className="mt-3 divide-y divide-border border-t border-border">
          {items.map((item) => (
            <li key={item.id}>
              <details>
                <summary className="flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{item.label}</span>
                    {item.score ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        AI {item.score}
                      </span>
                    ) : null}
                    {item.latestOnly ? (
                      <span className="font-mono text-[11px] text-muted-foreground">最新</span>
                    ) : null}
                    <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">
                      {item.at ? formatDateJa(item.at) : "—"}
                    </span>
                  </div>
                  {item.summary ? (
                    <p className="line-clamp-2 text-left text-[12.5px] leading-snug text-muted-foreground">
                      {item.summary}
                    </p>
                  ) : null}
                </summary>
                <div className="ui-panel mb-3 p-3">
                  {item.modelLabel || item.model ? (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {item.modelLabel || item.model}
                    </p>
                  ) : null}
                  {item.model && item.modelLabel && item.model !== item.modelLabel ? (
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                      {item.model}
                    </p>
                  ) : null}
                  {item.kind === "research" ? <ResearchSourcesList sources={item.sources} /> : null}
                  {item.body ? (
                    <div
                      className={item.kind === "research" ? "mt-3 border-t border-border pt-3" : ""}
                    >
                      {item.kind === "research" ? (
                        <h4 className="text-[12.5px] font-medium">AIコメント</h4>
                      ) : null}
                      <p
                        className={`${item.kind === "research" ? "mt-1.5" : "mt-2"} whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground`}
                      >
                        {item.body}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12.5px] text-muted-foreground">本文はありません。</p>
                  )}
                  {item.latestOnly ? (
                    <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
                      この種類は上書き保存です。以前の実行は残っていません。
                    </p>
                  ) : null}
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
