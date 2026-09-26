import { Link } from "react-router";
import { useT } from "../i18n/context";
import { SETTINGS_PATH } from "../lib/home-path";
import { IconSettings } from "./icons";

export function SettingsIconLink({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <Link
      to={SETTINGS_PATH}
      aria-label={t.nav.items.settings}
      className={`flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground no-underline hover:text-foreground ${className}`}
    >
      <IconSettings className="h-5 w-5" />
    </Link>
  );
}
