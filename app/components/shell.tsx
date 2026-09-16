import { NavLink } from "react-router";
import type { ReactNode } from "react";

export const NAV = [
  { to: "/app/capture", label: "キャプチャ", short: "取る" },
  { to: "/app", label: "熟成ボード", short: "看板", end: true },
  { to: "/app/merge", label: "融合", short: "融合" },
  { to: "/app/research", label: "リサーチ", short: "研究" },
  { to: "/app/team", label: "チーム", short: "設定" },
] as const;

export function MockBanner() {
  return (
    <div className="border-b border-white/10 bg-[#d4a574]/10 px-4 py-2 text-center text-xs text-[#d4a574]">
      画面認識用の静的モックです。保存・認証・AI はまだ動きません。
    </div>
  );
}

export function StagePill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tracking-wide text-[#d4a574]">
      {label}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0e12]">
      <MockBanner />
      <div className="flex min-h-[calc(100vh-36px)]">
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#10141c] md:flex md:flex-col">
          <a href="/" className="px-5 py-5 font-serif text-lg text-[#e8e6e1] no-underline">
            アイデアクラウド
          </a>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm no-underline ${
                    isActive
                      ? "bg-white/10 text-[#e8e6e1]"
                      : "text-[#9a958c] hover:bg-white/5 hover:text-[#e8e6e1]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="px-5 py-4 text-[11px] leading-relaxed text-[#9a958c]">
            LiteLLM のような静かな作業画面。モバイルは取る、デスクトップは熟す。
          </p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-8">
            <p className="text-sm text-[#9a958c]">Atarashi Lab · モックセッション</p>
            <a href="/login" className="text-xs text-[#7eb8a8] no-underline hover:underline">
              ログイン（スタブ）
            </a>
          </header>
          <div className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-white/10 bg-[#10141c] md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              `py-3 text-center text-[11px] no-underline ${
                isActive ? "text-[#d4a574]" : "text-[#9a958c]"
              }`
            }
          >
            {item.short}
          </NavLink>
        ))}
      </nav>
      <div className="h-14 md:hidden" />
    </div>
  );
}
