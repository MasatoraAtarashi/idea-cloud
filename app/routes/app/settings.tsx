import { MEMBERS, SESSION_USER } from "../../data/mock";

export function meta() {
  return [{ title: "設定 — アイデアクラウド" }];
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[15px] font-medium tracking-tight">設定</h1>
      <section className="ui-panel mt-4 p-4">
        <h2 className="text-[13px] font-medium">チーム</h2>
        {MEMBERS.length === 0 ? (
          <ul className="mt-3 divide-y divide-border">
            <li className="flex items-center justify-between py-2.5 text-[13px]">
              <span>{SESSION_USER.label}</span>
              <span className="text-xs text-muted-foreground">オーナー</span>
            </li>
          </ul>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {MEMBERS.map((member) => (
              <li
                key={member.email}
                className="flex items-center justify-between py-2.5 text-[13px]"
              >
                <span>
                  {member.name}
                  <span className="ml-2 text-xs text-muted-foreground">{member.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.role === "owner" ? "オーナー" : "メンバー"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="ui-panel mt-3 p-4">
        <h2 className="text-[13px] font-medium">アクセス</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">許可リストはまだありません。</p>
      </section>
    </div>
  );
}
