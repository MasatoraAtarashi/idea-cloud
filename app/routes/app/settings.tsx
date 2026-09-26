import { useEffect, useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useOutletContext,
  type LoaderFunctionArgs,
} from "react-router";
import { LOGOUT_PATH } from "../../auth/google-login";
import type { AppData } from "./layout";
import { initialsFromLabel } from "../../lib/format";
import { LIST_PATH } from "../../lib/home-path";
import {
  BILLING_CHECKOUT_PATH,
  BILLING_PORTAL_PATH,
  BILLING_STATUS_PATH,
  startBilling,
  type BillingStatus,
} from "../../lib/billing";
import { workspaceSettingsAction, type WorkspaceActionData } from "../../lib/workspace-action";
import { createRootDb } from "../../../db/client";
import {
  INVITE_TTL_DAYS,
  WORKSPACE_NAME_MAX,
  listActiveInvites,
  listApiKeys,
  listMembers,
  listMembershipsForEmail,
} from "../../../db/workspaces";

export { workspaceSettingsAction as action };

const SECTIONS = [
  { id: "members", group: "ワークスペース", label: "メンバーとアクセス" },
  { id: "general", group: "ワークスペース", label: "一般" },
  { id: "api", group: "ワークスペース", label: "API キー（MCP）" },
  { id: "stages", group: "ワークスペース", label: "段階とラベル" },
  { id: "profile", group: "個人", label: "プロフィール" },
  { id: "notify", group: "個人", label: "通知と熟成リマインド" },
  { id: "shortcuts", group: "個人", label: "ショートカット" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function meta() {
  return [{ title: "設定 — アイデアクラウド" }];
}

/**
 * Members, invites and keys are read with the unscoped handle but always for
 * `context.workspace.id`, which the page gate resolved from this session's
 * membership. Owner-only lists are still returned empty to members.
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const workspace = context.workspace!;
  const email = context.userEmail ?? "";
  const db = createRootDb(context.cloudflare.env.DB);
  const isOwner = workspace.role === "owner";
  const [members, memberships, invites, keys] = await Promise.all([
    listMembers(db, workspace.id),
    listMembershipsForEmail(db, email),
    isOwner ? listActiveInvites(db, workspace.id) : Promise.resolve([]),
    isOwner ? listApiKeys(db, workspace.id) : Promise.resolve([]),
  ]);
  return {
    members: members.map((row) => ({ email: row.email, role: row.role, since: row.createdAt })),
    memberships,
    invites: invites.map((row) => ({
      id: row.id,
      role: row.role,
      expiresAt: row.expiresAt,
      uses: row.uses,
      maxUses: row.maxUses,
    })),
    keys: keys.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
    })),
  };
}

export default function SettingsPage() {
  const { userEmail, premium, workspace } = useOutletContext<AppData>();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof workspaceSettingsAction>() as
    WorkspaceActionData | undefined;
  const [section, setSection] = useState<SectionId>("members");

  useEffect(() => {
    if (!actionData?.intent) return;
    if (actionData.intent.startsWith("key-")) setSection("api");
    else if (actionData.intent === "rename" || actionData.intent === "create-workspace") {
      setSection("general");
    }
  }, [actionData]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Link
          to={LIST_PATH}
          className="flex min-h-11 min-w-[3.5rem] items-center text-[13.5px] font-medium text-foreground no-underline"
        >
          戻る
        </Link>
        <h1 className="text-[13.5px] font-semibold">設定</h1>
        <span className="min-w-[3.5rem]" />
      </header>
      <aside className="w-full shrink-0 border-b border-border px-3 py-4 md:w-52 md:border-b-0 md:border-r">
        <p className="hidden px-2 text-[16px] font-semibold md:block">設定</p>
        <p className="hidden truncate px-2 pt-1 text-[11.5px] text-muted-foreground md:block">
          {workspace.name}
        </p>
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
                  className={`flex min-h-11 shrink-0 items-center rounded-md px-3 text-left text-[13px] md:min-h-0 md:px-2 md:py-1.5 ${
                    section === item.id
                      ? "bg-muted font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:bg-row-hover hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
        {section === "members" ? (
          <MembersPanel
            userEmail={userEmail}
            isOwner={workspace.role === "owner"}
            members={data.members}
            invites={data.invites}
            actionData={actionData}
          />
        ) : section === "general" ? (
          <GeneralPanel
            workspace={workspace}
            memberships={data.memberships}
            actionData={actionData}
          />
        ) : section === "api" ? (
          <ApiKeysPanel
            isOwner={workspace.role === "owner"}
            keys={data.keys}
            actionData={actionData}
          />
        ) : section === "profile" ? (
          <ProfilePanel userEmail={userEmail} premium={premium} />
        ) : (
          <StubPanel section={section} />
        )}
      </div>
    </div>
  );
}

function ActionNote({ data, intents }: { data?: WorkspaceActionData; intents: string[] }) {
  if (!data || !intents.includes(data.intent)) return null;
  if (data.error) {
    return (
      <p role="alert" className="mt-2 text-[12.5px] text-danger">
        {data.error}
      </p>
    );
  }
  return null;
}

function useBusy(intent: string): boolean {
  const navigation = useNavigation();
  return navigation.state !== "idle" && navigation.formData?.get("intent") === intent;
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-[10px] border border-border bg-sunken p-3">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <input
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          className="ui-input min-w-0 flex-1 font-mono text-[12px]"
        />
        <button
          type="button"
          className="ui-btn-secondary shrink-0 px-3"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
    </div>
  );
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function MembersPanel({
  userEmail,
  isOwner,
  members,
  invites,
  actionData,
}: {
  userEmail: string | null;
  isOwner: boolean;
  members: LoaderData["members"];
  invites: LoaderData["invites"];
  actionData?: WorkspaceActionData;
}) {
  const inviting = useBusy("invite-create");
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold">メンバーとアクセス</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            このワークスペースのアイデアとインスピレーションは、メンバー全員が閲覧・編集できます。
          </p>
        </div>
        {isOwner ? (
          <Form method="post">
            <input type="hidden" name="intent" value="invite-create" />
            <button type="submit" disabled={inviting} className="ui-btn">
              招待リンクを作る
            </button>
          </Form>
        ) : null}
      </div>
      <ActionNote data={actionData} intents={["invite-create", "invite-revoke", "member-remove"]} />
      {actionData?.intent === "invite-create" && actionData.inviteUrl ? (
        <CopyField
          value={actionData.inviteUrl}
          label={`招待リンク（${INVITE_TTL_DAYS}日間有効・Google でログインした人が参加できます）`}
        />
      ) : null}
      <div className="mt-4 overflow-hidden rounded-[10px] border border-border">
        <table className="ui-table">
          <thead>
            <tr>
              <th>メンバー</th>
              <th>権限</th>
              <th>参加</th>
              {isOwner ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = userEmail?.toLowerCase() === member.email;
              return (
                <tr key={member.email}>
                  <td>
                    <div className="flex items-center gap-2.5 py-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-muted font-mono text-[11px] text-secondary">
                        {initialsFromLabel(member.email)}
                      </span>
                      <span className="font-mono text-[12px]">
                        {member.email}
                        {isSelf ? (
                          <span className="font-sans text-muted-foreground">（自分）</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="text-[13px] text-muted-foreground">
                    {member.role === "owner" ? "管理者" : "メンバー"}
                  </td>
                  <td className="font-mono text-[11.5px] text-muted-foreground">
                    {member.since.slice(0, 10)}
                  </td>
                  {isOwner ? (
                    <td className="text-right">
                      {!isSelf ? (
                        <Form method="post">
                          <input type="hidden" name="intent" value="member-remove" />
                          <input type="hidden" name="email" value={member.email} />
                          <button type="submit" className="ui-btn-ghost px-2 text-[12px]">
                            削除
                          </button>
                        </Form>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isOwner && invites.length > 0 ? (
        <section className="mt-8">
          <h3 className="text-[14px] font-semibold">有効な招待リンク</h3>
          <ul className="mt-2 divide-y divide-border rounded-[10px] border border-border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                <span className="text-muted-foreground">
                  {invite.role === "owner" ? "管理者として" : "メンバーとして"}参加 · {invite.uses}/
                  {invite.maxUses} 回使用 · {invite.expiresAt.slice(0, 10)} まで
                </span>
                <Form method="post" className="ml-auto">
                  <input type="hidden" name="intent" value="invite-revoke" />
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button type="submit" className="ui-btn-ghost px-2 text-[12px]">
                    無効化
                  </button>
                </Form>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-muted-foreground">
            リンクの本文は保存していないため、再表示はできません。必要なら作り直してください。
          </p>
        </section>
      ) : null}
      <section className="mt-8">
        <h3 className="text-[14px] font-semibold">このワークスペースから離脱</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          離脱後は別のワークスペースに切り替わります。最後の管理者は離脱できません。
        </p>
        <Form
          method="post"
          className="mt-2"
          onSubmit={(event) => {
            if (!confirm("このワークスペースから離脱しますか？")) event.preventDefault();
          }}
        >
          <input type="hidden" name="intent" value="leave" />
          <button type="submit" className="ui-btn-danger px-3">
            離脱する
          </button>
        </Form>
        <ActionNote data={actionData} intents={["leave"]} />
      </section>
    </div>
  );
}

function GeneralPanel({
  workspace,
  memberships,
  actionData,
}: {
  workspace: AppData["workspace"];
  memberships: LoaderData["memberships"];
  actionData?: WorkspaceActionData;
}) {
  const isOwner = workspace.role === "owner";
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-semibold">一般</h2>
      <section className="mt-4 rounded-[10px] border border-border p-4">
        <p className="text-[12px] text-muted-foreground">ワークスペース名</p>
        <Form method="post" className="mt-2 flex items-center gap-2">
          <input type="hidden" name="intent" value="rename" />
          <input
            name="name"
            defaultValue={workspace.name}
            maxLength={WORKSPACE_NAME_MAX}
            disabled={!isOwner}
            className="ui-input min-w-0 flex-1"
            aria-label="ワークスペース名"
          />
          <button type="submit" disabled={!isOwner} className="ui-btn-secondary px-3">
            保存
          </button>
        </Form>
        {!isOwner ? (
          <p className="mt-2 text-[12px] text-muted-foreground">名前の変更は管理者のみできます。</p>
        ) : null}
        <ActionNote data={actionData} intents={["rename"]} />
        {actionData?.intent === "rename" && actionData.ok ? (
          <p className="mt-2 text-[12.5px] text-muted-foreground">保存しました。</p>
        ) : null}
      </section>
      <section className="mt-8">
        <h3 className="text-[14px] font-semibold">参加しているワークスペース</h3>
        <ul className="mt-2 divide-y divide-border rounded-[10px] border border-border">
          {memberships.map((membership) => {
            const current = membership.workspaceId === workspace.id;
            return (
              <li key={membership.workspaceId} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                  {membership.name}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {membership.role === "owner" ? "管理者" : "メンバー"}
                </span>
                {current ? (
                  <span className="rounded-[6px] bg-muted px-2 py-0.5 text-[11.5px] text-secondary">
                    現在
                  </span>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="intent" value="switch" />
                    <input type="hidden" name="workspaceId" value={membership.workspaceId} />
                    <button type="submit" className="ui-btn-secondary px-3 text-[12px]">
                      切り替え
                    </button>
                  </Form>
                )}
              </li>
            );
          })}
        </ul>
        <ActionNote data={actionData} intents={["switch"]} />
      </section>
      <section className="mt-8">
        <h3 className="text-[14px] font-semibold">新しいワークスペースを作る</h3>
        <Form method="post" className="mt-2 flex items-center gap-2">
          <input type="hidden" name="intent" value="create-workspace" />
          <input
            name="name"
            placeholder="チーム名やプロジェクト名"
            maxLength={WORKSPACE_NAME_MAX}
            className="ui-input min-w-0 flex-1"
            aria-label="新しいワークスペース名"
          />
          <button type="submit" className="ui-btn px-3">
            作成
          </button>
        </Form>
        <ActionNote data={actionData} intents={["create-workspace"]} />
      </section>
    </div>
  );
}

function ApiKeysPanel({
  isOwner,
  keys,
  actionData,
}: {
  isOwner: boolean;
  keys: LoaderData["keys"];
  actionData?: WorkspaceActionData;
}) {
  const creating = useBusy("key-create");
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-semibold">API キー（MCP）</h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Cursor や Claude Desktop などのエージェントが <code className="ui-kbd">/mcp</code>{" "}
        へ接続するときの <code className="ui-kbd">Authorization: Bearer</code>{" "}
        です。キーはこのワークスペースのデータだけを読み書きできます。
      </p>
      {!isOwner ? (
        <p className="mt-4 text-[13px] text-muted-foreground">
          キーの発行と管理は管理者のみできます。
        </p>
      ) : (
        <>
          <Form method="post" className="mt-4 flex items-center gap-2">
            <input type="hidden" name="intent" value="key-create" />
            <input
              name="name"
              placeholder="用途（例: Cursor）"
              maxLength={60}
              className="ui-input min-w-0 flex-1"
              aria-label="キーの名前"
            />
            <button type="submit" disabled={creating} className="ui-btn px-3">
              発行
            </button>
          </Form>
          <ActionNote data={actionData} intents={["key-create", "key-revoke"]} />
          {actionData?.intent === "key-create" && actionData.createdKey ? (
            <CopyField
              value={actionData.createdKey}
              label="新しいキー。今だけ表示されます。閉じると二度と見られません。"
            />
          ) : null}
          <ul className="mt-4 divide-y divide-border rounded-[10px] border border-border">
            {keys.length === 0 ? (
              <li className="px-3 py-3 text-[12.5px] text-muted-foreground">
                まだキーはありません。
              </li>
            ) : (
              keys.map((key) => (
                <li key={key.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate font-medium">{key.name}</span>
                  <span className="font-mono text-muted-foreground">{key.prefix}…</span>
                  <span className="text-muted-foreground">
                    {key.lastUsedAt ? `最終使用 ${key.lastUsedAt.slice(0, 10)}` : "未使用"}
                  </span>
                  <Form method="post">
                    <input type="hidden" name="intent" value="key-revoke" />
                    <input type="hidden" name="keyId" value={key.id} />
                    <button type="submit" className="ui-btn-ghost px-2 text-[12px]">
                      無効化
                    </button>
                  </Form>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function periodEndLabel(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Plan and subscription. The row is read from `/api/billing` after mount rather
 * than from the outlet so it reflects a checkout that just completed, and
 * every money action hands off to a Stripe-hosted page.
 */
function BillingRow({ premium }: { premium: boolean }) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(BILLING_STATUS_PATH, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? (response.json() as Promise<BillingStatus>) : null))
      .then((body) => {
        if (live && body) setStatus(body);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  async function go(path: string) {
    setPending(true);
    setError(await startBilling(path));
    setPending(false);
  }

  const isPremium = status ? status.plan === "premium" : premium;
  const paidThrough = periodEndLabel(status?.currentPeriodEnd ?? null);

  return (
    <>
      <p className="mt-3 text-[12px] text-muted-foreground">プラン</p>
      <p className="mt-1 text-[13.5px] font-semibold">
        {isPremium ? "プレミアム（AI機能あり）" : "フリー（AI機能なし）"}
      </p>
      {status?.comped ? (
        <p className="mt-1 text-[12px] text-muted-foreground">
          管理者による付与のため、支払いはありません。
        </p>
      ) : null}
      {paidThrough ? (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {status?.status === "canceled" ? "利用できるのは" : "次回更新"} {paidThrough}
          {status?.status === "past_due" ? "（支払いを再試行中）" : ""}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!isPremium ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => go(BILLING_CHECKOUT_PATH)}
            className="ui-btn"
          >
            プレミアムにする
          </button>
        ) : null}
        {status?.manageable ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => go(BILLING_PORTAL_PATH)}
            className="ui-btn-secondary px-3"
          >
            支払い方法・解約
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** The signed-in Google account. Membership lives in workspace_members, not here. */
function ProfilePanel({ userEmail, premium }: { userEmail: string | null; premium: boolean }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-semibold">プロフィール</h2>
      <div className="mt-4 rounded-[10px] border border-border p-4">
        <p className="text-[12px] text-muted-foreground">ログイン中の Google アカウント</p>
        <p className="mt-1 font-mono text-[13.5px]">{userEmail ?? "不明"}</p>
        <BillingRow premium={premium} />
        <form method="post" action={LOGOUT_PATH} className="mt-4">
          <button type="submit" className="ui-btn">
            ログアウト
          </button>
        </form>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        名前とアイコンは Google の設定に従います。支払いは Stripe のページで完結します。
      </p>
    </div>
  );
}

function StubPanel({ section }: { section: SectionId }) {
  const label = SECTIONS.find((item) => item.id === section)?.label ?? "設定";
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-semibold">{label}</h2>
      <p className="mt-3 text-[13.5px] text-muted-foreground">まだありません。</p>
    </div>
  );
}
