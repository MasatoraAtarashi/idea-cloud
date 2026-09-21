import { Link } from "react-router";
import { useCompose } from "../lib/compose";
import { NEW_IDEA_PATH } from "../lib/home-path";
import { IconPlus } from "./icons";

const plusClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground no-underline hover:brightness-95";

export function IdeaHeaderCreateButton() {
  const { open } = useCompose();
  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`${plusClass} hidden md:flex`}
        aria-label="新規アイデア"
      >
        <IconPlus className="h-5 w-5" strokeWidth={2.2} />
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
