import { Link } from "react-router";
import { SETTINGS_PATH } from "../lib/home-path";
import { IconSettings } from "./icons";

export function SettingsIconLink({ className = "" }: { className?: string }) {
  return (
    <Link
      to={SETTINGS_PATH}
      aria-label="設定"
      className={`flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground no-underline hover:text-foreground ${className}`}
    >
      <IconSettings className="h-5 w-5" />
    </Link>
  );
}
