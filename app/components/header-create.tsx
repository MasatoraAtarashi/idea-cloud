import { Link } from "react-router";
import { useCompose } from "../lib/compose";
import { NEW_IDEA_PATH } from "../lib/home-path";
import { IconPlus } from "./icons";

const plusClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground no-underline hover:bg-[#1d2939] md:h-8 md:w-8 md:rounded-[7px]";

/** Desktop: labelled primary button (opens the compose modal). Phone: 44px dark square. */
export function IdeaHeaderCreateButton() {
  const { open } = useCompose();
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="ui-btn hidden gap-1 px-3.5 md:inline-flex"
        aria-label="新規アイデア"
        title="新規アイデア (⌘N)"
      >
        <span aria-hidden="true">＋</span>
        新規アイデア
      </button>
      <Link to={NEW_IDEA_PATH} className={`${plusClass} md:hidden`} aria-label="新規アイデア">
        <IconPlus className="h-5 w-5" strokeWidth={2.2} />
      </Link>
    </>
  );
}

export function HeaderPlusButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={plusClass} aria-label={label}>
      <IconPlus className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}
