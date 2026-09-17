import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { IconBack, IconClock, IconGif, IconImage, IconPin, IconPoll, IconUsers } from "./icons";
import { LIST_PATH } from "../lib/home-path";

const STUB_TOOLS = [
  { label: "画像（未配線）", Icon: IconImage },
  { label: "GIF（未配線）", Icon: IconGif },
  { label: "投票（未配線）", Icon: IconPoll },
  { label: "予約（未配線）", Icon: IconClock },
  { label: "位置（未配線）", Icon: IconPin },
] as const;

export function CaptureView({ autofocus = false }: { autofocus?: boolean }) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const canSubmit = Boolean(draft.trim());

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");
    setNotice("置きました。まだ保存していません。");
  }

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col bg-background px-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={LIST_PATH}
              aria-label="戻る"
              className="flex h-10 w-10 items-center justify-center text-foreground no-underline"
            >
              <IconBack className="h-6 w-6" />
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ui-btn h-8 rounded-full px-4 text-sm disabled:opacity-40"
            >
              置く
            </button>
          </div>

          <div className="mt-3 flex min-h-[8.5rem] gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconUsers className="h-4 w-4" />
            </span>
            <label htmlFor="idea-mobile" className="sr-only">
              いま思いついたこと
            </label>
            <textarea
              id="idea-mobile"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus={autofocus}
              placeholder="いま思いついたこと"
              className="min-h-[8.5rem] w-full resize-none border-0 bg-transparent pt-1.5 text-[22px] leading-snug text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-4 flex items-center gap-0.5 border-t border-border py-2">
            {STUB_TOOLS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center text-muted-foreground disabled:opacity-50"
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
          {notice ? <p className="pb-4 text-xs text-muted-foreground">{notice}</p> : null}
        </form>
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
            placeholder="いま思いついたこと"
            className="ui-input mt-2 h-auto resize-none py-3"
          />
          <div className="mt-3 flex items-center justify-between">
            <button type="submit" disabled={!canSubmit} className="ui-btn rounded-full px-4">
              置く
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
      </div>
    </>
  );
}
