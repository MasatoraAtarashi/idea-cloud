import { useEffect, type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router";
import { SESSION_USER } from "../data/mock";
import { ComposeProvider, useCompose } from "../lib/compose";
import { isComposePath, isDesktopViewport, LIST_PATH } from "../lib/home-path";
import { isNewIdeaShortcut } from "../lib/shortcuts";
import { MOBILE_NAV, SETTINGS_NAV, WORKSPACE_NAV } from "../nav";
import { Brand } from "./brand";
import { ComposeDialog } from "./compose-dialog";
import { IconList, IconPlus, IconSettings, IconUsers } from "./icons";

const ICONS = {
  list: IconList,
  plus: IconPlus,
  settings: IconSettings,
  users: IconUsers,
} as const;

function navClass(isActive: boolean) {
  return [
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] no-underline",
    isActive
      ? "bg-card font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  ].join(" ");
}

function SidebarNav() {
  const location = useLocation();
  const listActive =
    location.pathname === "/app/list" ||
    location.pathname.startsWith("/app/ideas") ||
    location.pathname.startsWith("/app/merge") ||
    location.pathname.startsWith("/app/research");

  return (
    <nav className="flex flex-1 flex-col px-2 pt-2">
      <div className="flex flex-col gap-0.5">
        {WORKSPACE_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={() => navClass(listActive)}
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
              className={({ isActive }) =>
                navClass(isActive || location.pathname.startsWith("/app/team"))
              }
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
  const composeChrome = isComposePath(location.pathname);

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
    <div className="min-h-screen bg-sidebar">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-3">
            <Link to={LIST_PATH} className="min-w-0 no-underline text-foreground">
              <Brand compact wordmarkClassName="truncate text-[13px] font-medium tracking-tight" />
            </Link>
            <button
              type="button"
              onClick={open}
              aria-label="新規アイデア"
              title="新規アイデア (⌘N)"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav />
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-[0_0_0_1px_var(--border)]">
                <IconUsers className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px]">{SESSION_USER.label}</p>
                <a
                  href="/login"
                  className="text-[11px] text-muted-foreground no-underline hover:text-foreground"
                >
                  ログアウト
                </a>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          {composeChrome ? null : (
            <header className="flex h-11 items-center border-b border-border bg-card px-4 md:hidden">
              <Link to={LIST_PATH} className="text-foreground no-underline">
                <Brand compact />
              </Link>
            </header>
          )}
          <div
            className={
              composeChrome
                ? "flex-1 px-0 pt-0 md:px-6 md:py-5"
                : "flex-1 px-4 py-4 md:px-6 md:py-5"
            }
          >
            {children}
          </div>
        </div>
      </div>
      {composeChrome ? null : (
        <>
          <nav className="fixed inset-x-0 bottom-0 grid grid-cols-3 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] md:hidden">
            {MOBILE_NAV.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const on = item.primary ? isComposePath(location.pathname) : isActive;
                    return `flex flex-col items-center gap-0.5 py-1.5 no-underline ${
                      on ? "text-foreground" : "text-muted-foreground"
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const on = item.primary ? isComposePath(location.pathname) : isActive;
                    return (
                      <>
                        {item.primary ? (
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              on
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/90 text-primary-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                        <span className={`text-[10px] ${on ? "font-medium" : ""}`}>
                          {item.label}
                        </span>
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </nav>
          <div className="h-16 md:hidden" />
        </>
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
