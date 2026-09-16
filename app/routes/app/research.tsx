import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IDEAS, ideasByStage } from "../../data/mock";

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
      "LiteLLM UI はサイドバー・テーブル・静かな配色。装飾より操作の予測可能性。",
      "モバイルはボトムナビ、デスクトップはレーン。同じ情報でも密度を変える。",
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
      <h1 className="font-serif text-3xl">リサーチ / プロトタイプ</h1>
      <p className="mt-2 text-sm text-[#9a958c]">
        選ばれたアイデアにだけ、調べる権利がある。安い Cloudflare Workers AI
        を後から接続する枠です。
      </p>
      <label className="mt-8 block text-xs text-[#9a958c]" htmlFor="idea-select">
        採用中のアイデア
      </label>
      <select
        id="idea-select"
        value={id}
        onChange={(event) => setId(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#141821] px-3 py-2 text-sm"
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
          className="mt-2 inline-block text-xs text-[#7eb8a8] no-underline hover:underline"
        >
          詳細を開く
        </Link>
      )}
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("research")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            tab === "research" ? "bg-white/10 text-[#e8e6e1]" : "text-[#9a958c]"
          }`}
        >
          リサーチ
        </button>
        <button
          type="button"
          onClick={() => setTab("proto")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            tab === "proto" ? "bg-white/10 text-[#e8e6e1]" : "text-[#9a958c]"
          }`}
        >
          プロトタイプ
        </button>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#141821] p-5">
        {tab === "research" ? (
          <ul className="space-y-3 text-sm leading-relaxed">
            {notes.research.map((line) => (
              <li key={line} className="pl-1">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed">{notes.proto}</p>
        )}
      </div>
    </div>
  );
}
