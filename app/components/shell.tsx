import { useEffect, type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router";
import { SESSION_USER } from "../data/mock";
import { initialsFromLabel } from "../lib/format";
import { ComposeProvider, useCompose } from "../lib/compose";
import { isDesktopViewport, LIST_PATH } from "../lib/home-path";
import { isNewIdeaShortcut } from "../lib/shortcuts";
import {
  isMobileNavActive,
  isMobileTabBarHidden,
  isWorkspaceNavActive,
  MOBILE_NAV,
  SETTINGS_NAV,
  WORKSPACE_NAV,
} from "../nav";
import { Brand } from "./brand";
import { ComposeDialog } from "./compose-dialog";
import { IconChart, IconList, IconPin, IconPlus, IconSettings } from "./icons";

const ICONS = {
  list: IconList,
  plus: IconPlus,
  settings: IconSettings,
  pin: IconPin,
  chart: IconChart,
} as const;

function navClass(isActive: boolean) {
  return [
    "flex items-center gap-2 rounded-md px-2 py-[7px] text-[13.5px] font-medium no-underline",
    isActive
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-row-hover hover:text-foreground",
  ].join(" ");
}

function SidebarNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-1 flex-col px-2 pt-1">
      <div className="flex flex-col gap-0.5">
        {WORKSPACE_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={() => navClass(isWorkspaceNavActive(item, location.pathname))}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
      <div className="mt-auto pb-1">
        {SETTINGS_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={() => navClass(isWorkspaceNavActive(item, location.pathname))}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { open, close } = useCompose();
  const hideTabBar = isMobileTabBarHidden(location.pathname);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isDesktopViewport()) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (!isNewIdeaShortcut(event)) return;
      event.preventDefault();
      open();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <div className="flex h-full">
        <aside className="hidden h-full w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="flex h-[52px] items-center px-4">
            <Link to={LIST_PATH} className="min-w-0 no-underline text-foreground">
              <Brand
                compact
                wordmarkClassName="truncate text-[13.5px] font-medium tracking-tight"
              />
            </Link>
          </div>
          <button
            type="button"
            onClick={open}
            className="mx-2 mt-3 flex min-h-11 items-center gap-2 rounded-md border border-border-control bg-card px-2.5 text-[13.5px] font-medium text-foreground hover:bg-row-hover md:h-[34px] md:min-h-[34px]"
            aria-label="新規アイデア"
            title="新規アイデア (⌘N)"
          >
            <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">新規アイデア</span>
            <kbd className="ui-kbd shrink-0 whitespace-nowrap">⌘N</kbd>
          </button>
          <SidebarNav />
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-mono text-[11px] font-medium text-primary">
                {initialsFromLabel(SESSION_USER.label)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-foreground">
                  {SESSION_USER.label}
                </p>
                <a
                  href="/login"
                  className="text-[12.5px] text-muted-foreground no-underline hover:text-foreground"
                >
                  ログアウト
                </a>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          {hideTabBar ? null : <div className="h-16 shrink-0 md:hidden" />}
        </div>
      </div>
      {hideTabBar ? null : (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="メイン"
        >
          {MOBILE_NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const on = isMobileNavActive(item, location.pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.ariaLabel}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 py-1.5 no-underline ${
                  on ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${on ? "text-foreground" : ""}`} />
                <span className={`text-[10px] ${on ? "font-medium text-foreground" : ""}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      )}
      <ComposeDialog />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ComposeProvider>
      <ShellFrame>{children}</ShellFrame>
    </ComposeProvider>
  );
}
