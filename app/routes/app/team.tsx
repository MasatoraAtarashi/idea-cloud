import { MEMBERS, SESSION_USER } from "../../data/mock";

export function meta() {
  return [{ title: "チーム — アイデアクラウド" }];
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold tracking-tight">チーム</h1>
      <section className="ui-panel mt-4 p-4">
        <h2 className="text-sm font-medium">メンバー</h2>
        {MEMBERS.length === 0 ? (
          <ul className="mt-3 divide-y divide-border">
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>{SESSION_USER.label}</span>
              <span className="text-xs text-muted-foreground">オーナー</span>
            </li>
          </ul>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {MEMBERS.map((member) => (
              <li key={member.email} className="flex items-center justify-between py-2.5 text-sm">
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
    </div>
  );
}
