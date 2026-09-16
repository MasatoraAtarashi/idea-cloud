import { Link, NavLink } from "react-router";
import type { ReactNode } from "react";
import { NAV, NAV_GROUPS } from "../data/nav";

export { NAV, NAV_GROUPS };

export function StagePill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title = "まだアイデアはない",
  actionTo = "/app/capture",
  actionLabel = "キャプチャする",
}: {
  title?: string;
  actionTo?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link to={actionTo} className="ui-btn">
        {actionLabel}
      </Link>
    </div>
  );
}

function navClass(isActive: boolean) {
  return [
    "relative rounded-md px-3 py-1.5 text-sm no-underline",
    isActive
      ? "bg-muted font-medium text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <Link to="/app" className="px-4 py-4 text-sm font-semibold text-foreground no-underline">
            アイデアクラウド
          </Link>
          <nav className="flex flex-1 flex-col gap-5 px-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => navClass(isActive)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <p className="px-4 py-3 text-[10px] leading-relaxed text-muted-foreground">
            閉じたワークスペース
          </p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-11 items-center justify-end border-b border-border px-4 md:px-6">
            <span className="text-xs text-muted-foreground">アカウント</span>
          </header>
          <div className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `py-2.5 text-center text-[11px] no-underline ${
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              }`
            }
          >
            {item.short}
          </NavLink>
        ))}
      </nav>
      <div className="h-12 md:hidden" />
    </div>
  );
}
