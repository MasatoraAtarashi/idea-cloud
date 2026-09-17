import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LIST_PATH } from "../lib/home-path";

export function CaptureView() {
  const [draft, setDraft] = useState("");
  const [caught, setCaught] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const canSubmit = Boolean(draft.trim());

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setCaught((current) => [trimmed, ...current]);
    setDraft("");
    setNotice("置きました。まだ保存していません。");
  }

  return (
    <>
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col md:hidden">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">着想</p>
            <button type="submit" disabled={!canSubmit} className="ui-btn h-8 rounded-full px-4">
              置く
            </button>
          </div>
          <label htmlFor="idea-mobile" className="sr-only">
            いまの着想
          </label>
          <textarea
            id="idea-mobile"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="いま浮かんだこと"
            className="mt-3 min-h-[12rem] flex-1 resize-none border-0 bg-transparent text-[17px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
        </form>
        {notice ? <p className="mt-2 text-xs text-muted-foreground">{notice}</p> : null}
        {caught.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {caught.map((item) => (
              <li key={item} className="border-t border-border py-2.5 text-sm">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mx-auto hidden max-w-2xl md:block">
        <h1 className="text-lg font-semibold tracking-tight">キャプチャ</h1>
        <form onSubmit={onSubmit} className="ui-panel mt-4 p-4">
          <label htmlFor="idea-desktop" className="text-xs text-muted-foreground">
            着想
          </label>
          <textarea
            id="idea-desktop"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={6}
            placeholder="着想を置く"
            className="ui-input mt-2 h-auto resize-none py-3"
          />
          <div className="mt-3 flex items-center justify-between">
            <button type="submit" disabled={!canSubmit} className="ui-btn">
              置いて寝かせる
            </button>
            <Link
              to={LIST_PATH}
              className="text-sm text-muted-foreground no-underline hover:text-foreground"
            >
              一覧
            </Link>
          </div>
        </form>
        {notice ? <p className="mt-3 text-xs text-muted-foreground">{notice}</p> : null}
        {caught.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {caught.map((item) => (
              <li
                key={item}
                className="rounded-md border border-border bg-muted px-3 py-2.5 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
