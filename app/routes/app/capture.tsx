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
      <h1 className="text-xl font-semibold">クイックキャプチャ</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        分類もタグも後回し。一文で置いて、忘れる。モバイル向けの入口です。
      </p>
      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="idea" className="text-xs text-muted-foreground">
          いまの着想
        </label>
        <textarea
          id="idea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={5}
          placeholder="歩きながら浮かんだことを、そのまま。"
          className="ui-input mt-2 resize-none py-3"
        />
        <div className="mt-3 flex items-center justify-between">
          <button type="submit" disabled={!draft.trim()} className="ui-btn">
            置いて寝かせる
          </button>
          <Link
            to="/app"
            className="text-sm text-muted-foreground no-underline hover:text-foreground"
          >
            ボードを見る
          </Link>
        </div>
      </form>
      {notice && <p className="mt-3 text-xs text-muted-foreground">{notice}</p>}
      {caught.length > 0 && (
        <ul className="mt-6 space-y-2">
          {caught.map((item) => (
            <li
              key={item}
              className="rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
