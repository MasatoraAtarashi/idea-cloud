import { useMemo, useState } from "react";
import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import { EmptyState } from "../../components/ui";
import { IDEAS, ideasByStage } from "../../data/mock";

export function meta() {
  return [{ title: "リサーチ — アイデアクラウド" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const from = new URL(request.url).searchParams.get("from");
  if (from && /^\d+$/.test(from)) {
    return redirect(`/app/ideas/${from}#research`);
  }
  return null;
}

export default function ResearchPage() {
  const selected = ideasByStage("selected");
  const [id, setId] = useState(selected[0]?.id ?? "");
  const [tab, setTab] = useState<"research" | "proto">("research");
  const idea = useMemo(() => IDEAS.find((item) => item.id === id), [id]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="ui-title text-[16px] tracking-tight">リサーチ</h1>
      {selected.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="まだありません" />
        </div>
      ) : (
        <>
          <label className="block text-xs text-muted-foreground" htmlFor="idea-select">
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
              <p className="text-sm text-muted-foreground">調査メモはまだありません。</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                小さな実験手順は、採用してから書きます。
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
