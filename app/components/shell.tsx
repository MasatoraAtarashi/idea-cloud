import { Link, NavLink, useLocation } from "react-router";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; short: string; end?: boolean };

const WORKSPACE_NAV: NavItem[] = [
  { to: "/app", label: "アイデア", short: "一覧", end: true },
  { to: "/app/capture", label: "キャプチャ", short: "取る" },
  { to: "/app/merge", label: "融合", short: "融合" },
  { to: "/app/research", label: "リサーチ", short: "研究" },
];

const SETTINGS_NAV: NavItem[] = [{ to: "/app/team", label: "チーム", short: "設定" }];

export const NAV = [
  { to: "/app/capture", label: "キャプチャ", short: "取る" },
  { to: "/app", label: "アイデア", short: "一覧", end: true },
  { to: "/app/merge", label: "融合", short: "融合" },
  { to: "/app/research", label: "リサーチ", short: "研究" },
  { to: "/app/team", label: "チーム", short: "設定" },
] as const;

const CRUMBS: { prefix: string; label: string }[] = [
  { prefix: "/app/capture", label: "キャプチャ" },
  { prefix: "/app/merge", label: "融合" },
  { prefix: "/app/research", label: "リサーチ" },
  { prefix: "/app/team", label: "チーム" },
  { prefix: "/app/ideas", label: "アイデア詳細" },
  { prefix: "/app", label: "アイデア" },
];

function BrandMark() {
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-md text-white"
      style={{ background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M6.5 19a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.6-1.5A4.5 4.5 0 1 1 17.5 19h-11z" />
      </svg>
    </span>
  );
}

function NavIcon({ to }: { to: string }) {
  const className = "h-4 w-4 shrink-0 opacity-70";
  if (to === "/app") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    );
  }
  if (to === "/app/capture") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (to === "/app/merge") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="7" cy="6" r="2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="12" r="2" />
        <path d="M7 8v8M9 12h6" />
      </svg>
    );
  }
  if (to === "/app/research") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4 18c.6-2.4 2.6-3.5 5-3.5s4.4 1.1 5 3.5M14 18c.4-1.6 1.6-2.4 3.2-2.4 1.4 0 2.5.7 3 2.1" />
    </svg>
  );
}

function navClass(isActive: boolean) {
  return [
    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] no-underline",
    isActive
      ? "bg-[#f4f4f5] font-medium text-foreground"
      : "text-muted-foreground hover:bg-[#f4f4f5] hover:text-foreground",
  ].join(" ");
}

function SideNav({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? false}
          className={({ isActive }) => navClass(isActive)}
        >
          <NavIcon to={item.to} />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

function crumbLabel(pathname: string) {
  return CRUMBS.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
    ?.label;
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const current = crumbLabel(location.pathname) ?? "アイデア";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-[232px] shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <Link
            to="/app"
            className="flex items-center gap-2.5 px-4 py-4 text-sm font-semibold text-foreground no-underline"
          >
            <BrandMark />
            アイデアクラウド
          </Link>
          <nav className="flex flex-1 flex-col gap-5 px-2 pb-4">
            <div>
              <p className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                ワークスペース
              </p>
              <SideNav items={WORKSPACE_NAV} />
            </div>
            <div>
              <p className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                アクセス
              </p>
              <SideNav items={SETTINGS_NAV} />
            </div>
          </nav>
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5 rounded-md px-1 py-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f5] text-muted-foreground">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="3" />
                  <path d="M5 19c1-3.2 3.6-5 7-5s6 1.8 7 5" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">アカウント</p>
                <Link
                  to="/login"
                  className="text-[11px] text-muted-foreground no-underline hover:text-foreground"
                >
                  ログアウト
                </Link>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4 md:px-6">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>アイデアクラウド</span>
              <span className="text-border">›</span>
              <span className="text-foreground">{current}</span>
            </nav>
          </header>
          <div className="flex flex-1 flex-col px-4 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
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
