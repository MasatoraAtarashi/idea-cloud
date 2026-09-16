import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IDEAS, ideasByStage } from "../../data/mock";
import { PageHeader } from "../../components/shell";

export function meta() {
  return [{ title: "リサーチ / プロトタイプ — アイデアクラウド" }];
}

const NOTES: Record<string, { research: string[]; proto: string }> = {
  "i-research-gate": {
    research: [
      "熟成前に調査すると、忘れる時間が消える。ゲートは『採用レーン』だけ。",
      "競合メモアプリはキャプチャが強いが、寝かせるUIを持たない。",
      "Workers AI の安価モデルで十分なら、本文全文は渡さない。",
    ],
    proto: "採用カードから『調べる』だけが生える。着想レーンには虫眼鏡を置かない。",
  },
  "i-litellm-ui": {
    research: [
      "LiteLLM ダッシュボードの既定はライト。白パネル、薄いグレーボーダー、ネイビーの主ボタン。",
      "サイドバー＋トップバーのシェル。装飾より操作の予測可能性。ダークは後から実験的。",
    ],
    proto: "看板は横スクロールの列。カードはタイトルと日数だけ。詳細は別ページ。",
  },
};

export default function ResearchPage() {
  const selected = ideasByStage("selected");
  const [id, setId] = useState(selected[0]?.id ?? IDEAS[0].id);
  const [tab, setTab] = useState<"research" | "proto">("research");
  const idea = useMemo(() => IDEAS.find((item) => item.id === id), [id]);
  const notes = NOTES[id] ?? {
    research: ["このアイデアの調査メモはまだありません（モック）。"],
    proto: "小さな実験手順は、採用してから書く。",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="リサーチ / プロトタイプ"
        description="選ばれたアイデアにだけ、調べる権利がある。安い Cloudflare Workers AI を後から接続する枠です。"
      />
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
      <div className="mt-6 flex gap-1 rounded-md border border-border bg-secondary p-0.5">
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
      <div className="ui-panel mt-3 overflow-hidden">
        {tab === "research" ? (
          <table className="ui-table">
            <thead>
              <tr>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {notes.research.map((line) => (
                <tr key={line}>
                  <td className="text-sm leading-relaxed">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-sm leading-relaxed">{notes.proto}</p>
        )}
      </div>
    </div>
  );
}
