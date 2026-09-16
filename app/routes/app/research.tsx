import { useMemo, useState } from "react";
import { Link } from "react-router";
import { EMPTY_RESEARCH_BODY, ideasByStage } from "../../data/mock";
import { EmptyState, PageHeader, Tabs } from "../../components/ui";

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
          <EmptyState title="採用レーンは空です" body={EMPTY_RESEARCH_BODY} />
        </div>
      ) : (
        <>
          <label className="block text-xs font-medium text-foreground" htmlFor="idea-select">
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
          {idea ? (
            <Link
              to={`/app/ideas/${idea.id}`}
              className="mt-2 inline-block text-xs text-muted-foreground no-underline hover:text-foreground"
            >
              詳細を開く
            </Link>
          ) : null}
          <div className="mt-6">
            <Tabs
              items={[
                { id: "research", label: "リサーチ" },
                { id: "proto", label: "プロトタイプ" },
              ]}
              value={tab}
              onChange={(next) => setTab(next as "research" | "proto")}
            />
          </div>
          <div className="ui-panel mt-3 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tab === "research"
                ? "このアイデアの調査メモはまだありません。"
                : "小さな実験手順は、採用してから書く。"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
