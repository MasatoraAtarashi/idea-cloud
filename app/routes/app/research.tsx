import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ideasByStage } from "../../data/mock";
import { EmptyState, PageHeader } from "../../components/shell";

export function meta() {
  return [{ title: "リサーチ / プロトタイプ — アイデアクラウド" }];
}

export default function ResearchPage() {
  const selected = ideasByStage("selected");
  const [id, setId] = useState(selected[0]?.id ?? "");
  const [tab, setTab] = useState<"research" | "proto">("research");
  const idea = useMemo(() => selected.find((item) => item.id === id), [id, selected]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="リサーチ / プロトタイプ"
        description="選ばれたアイデアにだけ、調べる権利がある。"
      />
      {selected.length === 0 ? (
        <div className="ui-panel">
          <EmptyState title="まだ採用したアイデアはない" />
        </div>
      ) : (
        <>
          <label className="mt-1 block text-xs text-muted-foreground" htmlFor="idea-select">
            採用中のアイデア
          </label>
          <select
            id="idea-select"
            value={id}
            onChange={(event) => setId(event.target.value)}
            className="ui-input mt-2"
          >
            {selected.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {idea && (
            <Link
              to={`/app/ideas/${idea.id}`}
              className="mt-2 inline-block text-xs text-muted-foreground no-underline hover:text-foreground"
            >
              詳細を開く
            </Link>
          )}
          <div className="mt-6 flex gap-1 rounded-md border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setTab("research")}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                tab === "research" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              リサーチ
            </button>
            <button
              type="button"
              onClick={() => setTab("proto")}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                tab === "proto" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              プロトタイプ
            </button>
          </div>
          <div className="ui-panel mt-3 p-4">
            {tab === "research" ? (
              <p className="text-sm text-muted-foreground">
                このアイデアの調査メモはまだありません。
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">小さな実験手順は、採用してから書く。</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
