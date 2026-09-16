import { useMemo, useState } from "react";
import { Link } from "react-router";
import { IDEAS } from "../../data/mock";

export function meta() {
  return [{ title: "融合 / 関連 — アイデアクラウド" }];
}

export default function MergePage() {
  const [selected, setSelected] = useState<string[]>(["i-forget-well", "i-friday-review"]);
  const [merged, setMerged] = useState<string | null>(null);

  const chosen = useMemo(() => IDEAS.filter((idea) => selected.includes(idea.id)), [selected]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setMerged(null);
  }

  function merge() {
    if (chosen.length < 2) return;
    const titles = chosen.map((idea) => idea.title).join(" × ");
    setMerged(`${titles} をひとつに重ね、金曜の棚でだけ触るルールにする。`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl">融合 / 関連</h1>
      <p className="mt-2 text-sm text-[#9a958c]">
        LiteLLM
        のコンソールのように、余白を残して選ぶ。近い着想を重ね、新しい一枚にする（結果はモック）。
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_20rem]">
        <ul className="space-y-2">
          {IDEAS.filter((idea) => idea.stage !== "archived").map((idea) => {
            const on = selected.includes(idea.id);
            return (
              <li key={idea.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#141821] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(idea.id)}
                    className="mt-1 accent-[#d4a574]"
                  />
                  <span>
                    <span className="block text-sm">{idea.title}</span>
                    <Link
                      to={`/app/ideas/${idea.id}`}
                      className="text-[11px] text-[#7eb8a8] no-underline hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      詳細
                    </Link>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <aside className="rounded-2xl border border-white/10 bg-[#10141c] p-5">
          <p className="text-xs text-[#9a958c]">選択中 {chosen.length} 件</p>
          <button
            type="button"
            onClick={merge}
            disabled={chosen.length < 2}
            className="mt-4 w-full rounded-full bg-[#d4a574] py-2 text-sm text-[#0c0e12] disabled:opacity-40"
          >
            融合する
          </button>
          {merged ? (
            <p className="mt-4 text-sm leading-relaxed text-[#e8e6e1]">{merged}</p>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-[#9a958c]">
              2 件以上選ぶと、重ねた一文がここに出ます。Workers AI の関係抽出は未配線です。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
