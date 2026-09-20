import { useState } from "react";
import { Link } from "react-router";
import { MEMBERS, SESSION_USER } from "../../data/mock";
import { initialsFromLabel } from "../../lib/format";
import { ANALYTICS_PATH, INSPIRATIONS_PATH } from "../../lib/home-path";

const SECTIONS = [
  { id: "members", group: "ワークスペース", label: "メンバーとアクセス" },
  { id: "general", group: "ワークスペース", label: "一般" },
  { id: "team", group: "ワークスペース", label: "チーム" },
  { id: "stages", group: "ワークスペース", label: "段階とラベル" },
  { id: "profile", group: "個人", label: "プロフィール" },
  { id: "notify", group: "個人", label: "通知と熟成リマインド" },
  { id: "shortcuts", group: "個人", label: "ショートカット" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function meta() {
  return [{ title: "設定 — アイデアクラウド" }];
}

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("members");

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <header className="flex h-[52px] items-center border-b border-border px-4 md:hidden">
        <h1 className="text-[16px] font-medium">設定</h1>
      </header>
      <aside className="w-full shrink-0 border-b border-border px-3 py-4 md:w-52 md:border-b-0 md:border-r">
        <p className="hidden px-2 text-[16px] font-medium md:block">設定</p>
        <nav className="mt-3 flex gap-1 overflow-x-auto md:mt-4 md:flex-col">
          {SECTIONS.map((item, index) => {
            const prev = SECTIONS[index - 1];
            const showGroup = item.group !== prev?.group;
            return (
              <div key={item.id} className="contents md:block">
                {showGroup ? (
                  <p className="mb-1 mt-3 hidden px-2 font-mono text-[11px] text-muted-foreground first:mt-0 md:block">
                    {item.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`shrink-0 rounded-md px-2 py-1.5 text-left text-[13px] ${
                    section === item.id
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-row-hover hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-6">
        <div className="mb-5 flex flex-wrap gap-2 md:hidden">
          <Link to={ANALYTICS_PATH} className="ui-btn-secondary px-3 text-[13px]">
            アナリティクス
          </Link>
          <Link to={INSPIRATIONS_PATH} className="ui-btn-secondary px-3 text-[13px]">
            インスピレーション
          </Link>
        </div>
        {section === "members" ? <MembersPanel /> : <StubPanel section={section} />}
      </div>
    </div>
  );
}

function MembersPanel() {
  const rows =
    MEMBERS.length === 0
      ? [{ name: SESSION_USER.label, email: "", role: SESSION_USER.role }]
      : MEMBERS;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium">メンバーとアクセス</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            アイデアの閲覧・編集範囲はチーム単位で決まります。
          </p>
        </div>
        <button type="button" disabled className="ui-btn opacity-40" title="未配線">
          メンバーを招待
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[10px] border border-border">
        <table className="ui-table">
          <thead>
            <tr>
              <th>メンバー</th>
              <th>権限</th>
              <th>最終アクセス</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <tr key={member.name}>
                <td>
                  <div className="flex items-center gap-2.5 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-mono text-[11px] text-primary">
                      {initialsFromLabel(member.name)}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-medium">{member.name}</span>
                      {member.email ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {member.email}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="text-[13px] text-muted-foreground">
                  {member.role === "owner" ? "管理者" : "メンバー"}
                </td>
                <td className="font-mono text-[11.5px] text-muted-foreground">ログイン中</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-8">
        <h3 className="text-[16px] font-medium">既定の公開範囲</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-[10px] border border-primary/30 bg-accent p-3">
            <p className="text-[13.5px] font-medium">チーム全体</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              同じチームの全員が閲覧・編集できる
            </p>
          </div>
          <div className="rounded-[10px] border border-border p-3">
            <p className="text-[13.5px] font-medium">起案者のみ</p>
            <p className="mt-1 text-[12px] text-muted-foreground">共有するまで本人だけに見える</p>
          </div>
          <div className="rounded-[10px] border border-border p-3">
            <p className="text-[13.5px] font-medium">ワークスペース全体</p>
            <p className="mt-1 text-[12px] text-muted-foreground">全チームから横断で参照できる</p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">表示のみ。保存はまだありません。</p>
      </section>
    </div>
  );
}

function StubPanel({ section }: { section: SectionId }) {
  const label = SECTIONS.find((item) => item.id === section)?.label ?? "設定";
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-medium">{label}</h2>
      <p className="mt-3 text-[13.5px] text-muted-foreground">まだありません。</p>
    </div>
  );
}
