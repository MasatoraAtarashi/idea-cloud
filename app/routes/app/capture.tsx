import { useState } from "react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "クイックキャプチャ — アイデアクラウド" }];
}

export default function CapturePage() {
  const [draft, setDraft] = useState("");
  const [caught, setCaught] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setCaught((current) => [trimmed, ...current]);
    setDraft("");
    setNotice("着想レーンへ置きました（モックのため保存していません）");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl">クイックキャプチャ</h1>
      <p className="mt-2 text-sm text-[#9a958c]">
        分類もタグも後回し。一文で置いて、忘れる。モバイル向けの入口です。
      </p>
      <form onSubmit={onSubmit} className="mt-8">
        <label htmlFor="idea" className="text-xs text-[#9a958c]">
          いまの着想
        </label>
        <textarea
          id="idea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={5}
          placeholder="歩きながら浮かんだことを、そのまま。"
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-sm outline-none focus:border-[#d4a574]/60"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-[#d4a574] px-5 py-2 text-sm text-[#0c0e12] disabled:opacity-40"
          >
            置いて寝かせる
          </button>
          <Link to="/app" className="text-sm text-[#7eb8a8] no-underline hover:underline">
            ボードを見る
          </Link>
        </div>
      </form>
      {notice && <p className="mt-4 text-xs text-[#7eb8a8]">{notice}</p>}
      {caught.length > 0 && (
        <ul className="mt-8 space-y-2">
          {caught.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-dashed border-white/15 bg-[#10141c] px-4 py-3 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
