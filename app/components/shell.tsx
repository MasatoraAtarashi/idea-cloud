import { NavLink } from "react-router";
import type { ReactNode } from "react";
import { ACCESS_NAV, MOBILE_NAV, WORKSPACE_NAV } from "../nav";
import { SESSION_USER } from "../data/mock";
import { IconList, IconMerge, IconPlus, IconSearch, IconUsers } from "./icons";

const ICONS = {
  list: IconList,
  plus: IconPlus,
  merge: IconMerge,
  search: IconSearch,
  users: IconUsers,
} as const;

function navClass(isActive: boolean) {
  return [
    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm no-underline",
    isActive
      ? "bg-white font-medium text-foreground"
      : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
  ].join(" ");
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: readonly { to: string; label: string; icon: keyof typeof ICONS; end?: boolean }[];
}) {
  return (
    <div className="px-2">
      <p className="px-2.5 pb-1 pt-4 text-[11px] font-medium tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) => navClass(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sidebar">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="flex h-12 items-center border-b border-border px-4">
            <span className="text-sm font-semibold tracking-tight">アイデアクラウド</span>
          </div>
          <nav className="flex-1 pb-4">
            <NavGroup title="ワークスペース" items={WORKSPACE_NAV} />
            <NavGroup title="アクセス" items={ACCESS_NAV} />
          </nav>
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-foreground">
                <IconUsers className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{SESSION_USER.label}</p>
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
          <div className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-border bg-background md:hidden">
        {MOBILE_NAV.map((item) => (
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
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="h-12 md:hidden" />
    </div>
  );
}
