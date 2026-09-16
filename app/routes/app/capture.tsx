import { useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../components/ui";

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
    setNotice("この画面のあいだだけ保持しています。");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="クイックキャプチャ"
        description="分類もタグも後回し。一文で置いて、忘れる。"
      />
      <form onSubmit={onSubmit} className="ui-panel p-4">
        <label htmlFor="idea" className="text-xs font-medium text-foreground">
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
            一覧を見る
          </Link>
        </div>
      </form>
      {notice ? <p className="mt-3 text-xs text-muted-foreground">{notice}</p> : null}
      {caught.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {caught.map((item) => (
            <li key={item} className="ui-panel px-3 py-2.5 text-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
