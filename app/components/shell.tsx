import { NavLink } from "react-router";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export const NAV = [
  { to: "/app/capture", label: "キャプチャ", short: "取る" },
  { to: "/app", label: "熟成ボード", short: "看板", end: true },
  { to: "/app/merge", label: "融合", short: "融合" },
  { to: "/app/research", label: "リサーチ", short: "研究" },
  { to: "/app/team", label: "チーム", short: "設定" },
] as const;

export function MockBanner() {
  return (
    <div className="border-b border-border bg-muted px-4 py-1.5 text-center text-[11px] text-muted-foreground">
      画面認識用の静的モックです。保存・認証・AI はまだ動きません。
    </div>
  );
}

export function StagePill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {label}
    </span>
  );
}

function navClass(isActive: boolean) {
  return [
    "relative rounded-md px-3 py-1.5 text-sm no-underline",
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
  ].join(" ");
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MockBanner />
      <div className="flex min-h-[calc(100vh-32px)]">
        <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
          <a
            href="/"
            className="px-4 py-4 text-sm font-semibold text-sidebar-foreground no-underline"
          >
            アイデアクラウド
          </a>
          <nav className="flex flex-1 flex-col gap-0.5 px-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) => navClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="px-4 py-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
            LiteLLM 型のライトコンソール · モバイルは取る
          </p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-11 items-center justify-between border-b border-border bg-card px-4 md:px-6">
            <p className="text-xs text-muted-foreground">Atarashi Lab · モックセッション</p>
            <a
              href="/login"
              className="text-xs text-muted-foreground no-underline hover:text-foreground"
            >
              ログイン（スタブ）
            </a>
          </header>
          <div className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-border bg-card md:hidden">
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
