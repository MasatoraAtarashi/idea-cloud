import { useEffect, useState, type ReactNode } from "react";
import { Form, NavLink, Link, useLocation } from "react-router";
import type { IdeaCategory } from "../lib/category";
import type { Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { LOGOUT_PATH } from "../auth/google-login";
import { initialsFromLabel } from "../lib/format";
import { ComposeProvider, useCompose } from "../lib/compose";
import { isDesktopViewport, LIST_PATH, SETTINGS_PATH } from "../lib/home-path";
import { listViewHref, SAVED_VIEW_NAME_MAX, type SavedViewItem } from "../lib/list-view-search";
import { CANDIDATE_DEFAULT_DAYS } from "../lib/review";
import { isSearchShortcut, SearchPaletteProvider, useSearchPalette } from "../lib/search-palette";
import { isNewIdeaShortcut } from "../lib/shortcuts";
import {
  isMobileNavActive,
  isMobileTabBarHidden,
  isWorkspaceNavActive,
  MOBILE_NAV,
  normalizeAppPath,
  SETTINGS_NAV,
  WORKSPACE_NAV,
} from "../nav";
import { ComposeDialog } from "./compose-dialog";
import { LanguageSwitcher } from "./language-switcher";
import { SearchPalette } from "./search-palette";

export type SidebarIdea = { id: string; title: string; stage: Stage };

export type ShellNav = {
  ideaCount: number;
  inspirationCount: number;
  reviewCount: number;
  savedViews: SavedViewItem[];
  /** Newest-updated first. Drives the detail sidebar's prev / next list. */
  ideas: SidebarIdea[];
  /** Signed-in Google email. `null` only if the page gate was bypassed. */
  userEmail: string | null;
  /** Current workspace; 設定 → 一般 switches it. */
  workspaceName: string;
};

function navCount(to: string, nav: ShellNav): number | null {
  if (to === "/app/list") return nav.ideaCount;
  if (to === "/app/inspirations") return nav.inspirationCount;
  return null;
}

function Logo() {
  return (
    <Link
      to={LIST_PATH}
      className="flex items-center gap-2.5 px-1.5 text-foreground no-underline"
      aria-label="Idea Cloud"
    >
      <span className="h-6 w-6 shrink-0 rounded-[7px] bg-accent" aria-hidden="true" />
      <span className="text-[14.5px] font-semibold tracking-[-0.01em]">Idea Cloud</span>
    </Link>
  );
}

function SearchField() {
  const { open } = useSearchPalette();
  const t = useT();
  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center gap-2 rounded-[8px] border border-border bg-sunken px-2.5 py-2 text-left hover:border-border-card"
      aria-label={t.nav.search.trigger}
    >
      <span className="text-[13px] leading-none text-muted-foreground" aria-hidden="true">
        ⌕
      </span>
      <span className="flex-1 text-[13px] text-muted-foreground">{t.nav.search.trigger}</span>
      <kbd className="ui-kbd">⌘K</kbd>
    </button>
  );
}

function sideRow(active: boolean) {
  return [
    "flex items-center gap-2 rounded-[8px] px-2.5 py-[7px] text-[13.5px] no-underline",
    active
      ? "bg-muted font-semibold text-foreground"
      : "text-secondary hover:bg-sunken hover:text-foreground",
  ].join(" ");
}

function WorkspaceNav({ nav }: { nav: ShellNav }) {
  const location = useLocation();
  const t = useT();
  return (
    <nav className="flex flex-col gap-0.5" aria-label={t.nav.workspace}>
      {WORKSPACE_NAV.map((item) => {
        const count = navCount(item.to, nav);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={() => sideRow(isWorkspaceNavActive(item, location.pathname))}
          >
            <span className="flex-1">{t.nav.items[item.labelKey]}</span>
            {count != null ? (
              <span className="font-mono text-[12px] font-normal text-muted-foreground">
                {count}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

function SavedViewsNav({ views }: { views: SavedViewItem[] }) {
  const location = useLocation();
  const [naming, setNaming] = useState(false);
  const t = useT();
  const onList = normalizeAppPath(location.pathname) === LIST_PATH;
  const activeId = new URLSearchParams(location.search).get("v");

  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2.5 pb-1 text-[11.5px] font-semibold text-muted-foreground">
        {t.nav.savedViews}
      </p>
      {views.map((view) => (
        <Link
          key={view.id}
          to={listViewHref({ ...view.filters, savedViewId: view.id })}
          className={sideRow(onList && activeId === String(view.id))}
        >
          <span className="truncate">{view.name}</span>
        </Link>
      ))}
      {naming ? (
        <Form
          method="post"
          action={`${LIST_PATH}${onList ? location.search : ""}`}
          className="px-1.5 pt-1"
          onSubmit={() => setNaming(false)}
        >
          <input type="hidden" name="intent" value="save-view" />
          <label className="sr-only" htmlFor="sidebar-view-name">
            {t.nav.viewName}
          </label>
          <input
            id="sidebar-view-name"
            name="name"
            autoFocus
            maxLength={SAVED_VIEW_NAME_MAX}
            placeholder={t.nav.viewName}
            onKeyDown={(event) => {
              if (event.key === "Escape") setNaming(false);
            }}
            className="ui-input md:h-8 text-[13px]"
          />
        </Form>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-[7px] text-left text-[13.5px] text-muted-foreground hover:bg-sunken hover:text-foreground"
        >
          <span aria-hidden="true">＋</span>
          {t.nav.saveCurrentFilters}
        </button>
      )}
    </div>
  );
}

function ReviewAlert({ count }: { count: number }) {
  const t = useT();
  if (count === 0) return null;
  return (
    <div className="rounded-[10px] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3.5 py-3">
      <p className="flex items-baseline gap-1.5 text-warn">
        <span className="font-mono text-[22px] leading-none font-semibold">{count}</span>
        <span className="text-[12.5px] font-semibold">{t.nav.reviewDueSuffix}</span>
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.7] text-[var(--warn-deep)]">
        {t.nav.reviewDueBody(CANDIDATE_DEFAULT_DAYS)}
      </p>
      <Link
        to={`${LIST_PATH}?tab=candidates&days=${CANDIDATE_DEFAULT_DAYS}`}
        className="mt-2.5 flex h-8 items-center justify-center rounded-[7px] border border-[var(--warn-border)] bg-card text-[12.5px] font-semibold text-warn no-underline hover:bg-[var(--warn-bg)]"
      >
        {t.nav.reviewDueAction}
      </Link>
    </div>
  );
}

function IdeaNeighbors({ ideas, currentId }: { ideas: SidebarIdea[]; currentId: string }) {
  const t = useT();
  const index = ideas.findIndex((idea) => idea.id === currentId);
  const window = index < 0 ? [] : ideas.slice(Math.max(0, index - 1), index + 2);
  return (
    <div className="flex flex-col gap-0.5">
      <Link
        to={LIST_PATH}
        className="mb-3 flex items-center gap-1.5 px-2.5 text-[13px] text-muted-foreground no-underline hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        {t.nav.items.ideas}
      </Link>
      {window.map((idea) => (
        <Link
          key={idea.id}
          to={`/app/ideas/${idea.id}`}
          prefetch="intent"
          aria-current={idea.id === currentId ? "page" : undefined}
          className={sideRow(idea.id === currentId)}
        >
          <span className="truncate">{idea.title}</span>
        </Link>
      ))}
    </div>
  );
}

function Sidebar({ nav }: { nav: ShellNav }) {
  const location = useLocation();
  const t = useT();
  const path = normalizeAppPath(location.pathname);
  const detailId = path.startsWith("/app/ideas/") ? path.slice("/app/ideas/".length) : null;

  return (
    <aside className="hidden h-full w-[236px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border bg-sidebar px-3.5 pt-5 pb-4 md:flex">
      <Logo />
      {detailId ? (
        <IdeaNeighbors ideas={nav.ideas} currentId={detailId} />
      ) : (
        <>
          <SearchField />
          <WorkspaceNav nav={nav} />
          <div className="border-t border-border" />
          <SavedViewsNav views={nav.savedViews} />
          <ReviewAlert count={nav.reviewCount} />
        </>
      )}
      <div className="mt-auto flex flex-col gap-1">
        {SETTINGS_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => sideRow(isWorkspaceNavActive(item, location.pathname))}
          >
            {t.nav.items[item.labelKey]}
          </NavLink>
        ))}
        <LanguageSwitcher className="px-2.5 py-1" />
        <AccountRow email={nav.userEmail} workspaceName={nav.workspaceName} />
      </div>
    </aside>
  );
}

/** Signed-in account plus sign-out. Plain form: /api/auth/logout is a Worker route. */
function AccountRow({ email, workspaceName }: { email: string | null; workspaceName: string }) {
  const t = useT();
  const label = email ?? t.common.sessionUser;
  return (
    <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
      <Link
        to={SETTINGS_PATH}
        className="truncate text-[11.5px] font-medium text-muted-foreground no-underline hover:text-foreground"
        title={`${t.settings.workspace.label}: ${workspaceName}`}
      >
        {workspaceName}
      </Link>
      <div className="flex items-center gap-2">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-muted font-mono text-[11px] font-medium text-secondary">
          {initialsFromLabel(label)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-secondary" title={label}>
          {label}
        </span>
        <form method="post" action={LOGOUT_PATH}>
          <button
            type="submit"
            className="shrink-0 rounded-[6px] px-1.5 py-1 text-[11.5px] font-medium text-muted-foreground hover:bg-row-hover hover:text-foreground"
          >
            {t.common.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}

function MobileTabIcon({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-[18px] w-[18px] rounded-[5px] ${on ? "bg-foreground" : "bg-border-card"}`}
    />
  );
}

function ShellFrame({
  children,
  categories,
  nav,
}: {
  children: ReactNode;
  categories: IdeaCategory[];
  nav: ShellNav;
}) {
  const location = useLocation();
  const t = useT();
  const { open, close } = useCompose();
  const search = useSearchPalette();
  const hideTabBar = isMobileTabBarHidden(location.pathname);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isSearchShortcut(event)) {
        event.preventDefault();
        if (search.isOpen) search.close();
        else search.open();
        return;
      }
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
  }, [close, open, search]);

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <div className="flex h-full">
        <Sidebar nav={nav} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          {hideTabBar ? null : <div className="mobile-tab-spacer shrink-0 md:hidden" />}
        </div>
      </div>
      {hideTabBar ? null : (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
          aria-label={t.nav.main}
        >
          {MOBILE_NAV.map((item) => {
            const on = isMobileNavActive(item, location.pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={t.nav.items[item.ariaLabelKey]}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 no-underline ${
                  on ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <MobileTabIcon on={on} />
                <span className={`text-[11px] ${on ? "font-semibold" : "font-medium"}`}>
                  {t.nav.items[item.labelKey]}
                </span>
              </NavLink>
            );
          })}
        </nav>
      )}
      <ComposeDialog categories={categories} />
      <SearchPalette />
    </div>
  );
}

export function AppShell({
  children,
  categories,
  nav,
}: {
  children: ReactNode;
  categories: IdeaCategory[];
  nav: ShellNav;
}) {
  return (
    <ComposeProvider>
      <SearchPaletteProvider>
        <ShellFrame categories={categories} nav={nav}>
          {children}
        </ShellFrame>
      </SearchPaletteProvider>
    </ComposeProvider>
  );
}
