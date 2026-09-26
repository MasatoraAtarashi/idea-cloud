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
import { LanguageSwitcher } from "../../components/language-switcher";
import { useT } from "../../i18n/context";
import { dictionary, type Dictionary } from "../../i18n/dictionary";
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
import type { Route } from "./+types/settings";

export { workspaceSettingsAction as action };

/** Order and grouping only: the copy comes from `t.settings.sections`. */
const SECTIONS = [
  { id: "members", group: "workspace" },
  { id: "general", group: "workspace" },
  { id: "api", group: "workspace" },
  { id: "stages", group: "workspace" },
  { id: "profile", group: "personal" },
  { id: "notify", group: "personal" },
  { id: "shortcuts", group: "personal" },
] as const satisfies readonly {
  id: keyof Dictionary["settings"]["sections"];
  group: keyof Dictionary["settings"]["groups"];
}[];

type SectionId = (typeof SECTIONS)[number]["id"];

/** `{name}` placeholders in dictionary strings. */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
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
    locale: context.locale,
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

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").settings.metaTitle }];
}

export default function SettingsPage() {
  const { userEmail, premium, workspace } = useOutletContext<AppData>();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof workspaceSettingsAction>() as
    WorkspaceActionData | undefined;
  const t = useT();
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
          {t.common.back}
        </Link>
        <h1 className="text-[13.5px] font-medium">{t.settings.title}</h1>
        <span className="min-w-[3.5rem]" />
      </header>
      <aside className="w-full shrink-0 border-b border-border px-3 py-4 md:w-52 md:border-b-0 md:border-r">
        <p className="hidden px-2 text-[16px] font-medium md:block">{t.settings.title}</p>
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
                    {t.settings.groups[item.group]}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex min-h-11 shrink-0 items-center rounded-md px-3 text-left text-[13px] md:min-h-0 md:px-2 md:py-1.5 ${
                    section === item.id
                      ? "bg-muted font-medium text-foreground"
                      : "font-medium text-muted-foreground hover:bg-row-hover hover:text-foreground"
                  }`}
                >
                  {t.settings.sections[item.id]}
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
  if (!data || !intents.includes(data.intent) || !data.error) return null;
  return (
    <p role="alert" className="mt-2 text-[12.5px] text-danger">
      {data.error}
    </p>
  );
}

function useBusy(intent: string): boolean {
  const navigation = useNavigation();
  return navigation.state !== "idle" && navigation.formData?.get("intent") === intent;
}

function CopyField({ value, label }: { value: string; label: string }) {
  const t = useT();
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
          {copied ? t.settings.workspace.copied : t.settings.workspace.copy}
        </button>
      </div>
    </div>
  );
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function roleLabel(t: Dictionary, role: string): string {
  return role === "owner" ? t.settings.members.roles.owner : t.settings.members.roles.member;
}

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
  const t = useT();
  const w = t.settings.workspace.members;
  const inviting = useBusy("invite-create");
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium">{t.settings.sections.members}</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{w.description}</p>
        </div>
        {isOwner ? (
          <Form method="post">
            <input type="hidden" name="intent" value="invite-create" />
            <button type="submit" disabled={inviting} className="ui-btn">
              {w.createInvite}
            </button>
          </Form>
        ) : null}
      </div>
      <ActionNote data={actionData} intents={["invite-create", "invite-revoke", "member-remove"]} />
      {actionData?.intent === "invite-create" && actionData.inviteUrl ? (
        <CopyField
          value={actionData.inviteUrl}
          label={fill(w.inviteLabel, { days: INVITE_TTL_DAYS })}
        />
      ) : null}
      <div className="mt-4 overflow-hidden rounded-[10px] border border-border">
        <table className="ui-table">
          <thead>
            <tr>
              <th>{t.settings.members.columns.member}</th>
              <th>{t.settings.members.columns.role}</th>
              <th>{w.joined}</th>
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
                          <span className="font-sans text-muted-foreground">{w.self}</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="text-[13px] text-muted-foreground">{roleLabel(t, member.role)}</td>
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
                            {w.remove}
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
          <h3 className="text-[14px] font-medium">{w.activeInvites}</h3>
          <ul className="mt-2 divide-y divide-border rounded-[10px] border border-border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                <span className="text-muted-foreground">
                  {fill(w.inviteRow, {
                    role: roleLabel(t, invite.role),
                    uses: invite.uses,
                    max: invite.maxUses,
                    until: invite.expiresAt.slice(0, 10),
                  })}
                </span>
                <Form method="post" className="ml-auto">
                  <input type="hidden" name="intent" value="invite-revoke" />
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button type="submit" className="ui-btn-ghost px-2 text-[12px]">
                    {w.revoke}
                  </button>
                </Form>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-muted-foreground">{w.inviteNote}</p>
        </section>
      ) : null}
      <section className="mt-8">
        <h3 className="text-[14px] font-medium">{w.leaveTitle}</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">{w.leaveBody}</p>
        <Form
          method="post"
          className="mt-2"
          onSubmit={(event) => {
            if (!confirm(w.leaveConfirm)) event.preventDefault();
          }}
        >
          <input type="hidden" name="intent" value="leave" />
          <button type="submit" className="ui-btn-danger px-3">
            {w.leave}
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
  const t = useT();
  const g = t.settings.workspace.general;
  const isOwner = workspace.role === "owner";
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-medium">{t.settings.sections.general}</h2>
      <section className="mt-4 rounded-[10px] border border-border p-4">
        <p className="text-[12px] text-muted-foreground">{g.name}</p>
        <Form method="post" className="mt-2 flex items-center gap-2">
          <input type="hidden" name="intent" value="rename" />
          <input
            name="name"
            defaultValue={workspace.name}
            maxLength={WORKSPACE_NAME_MAX}
            disabled={!isOwner}
            className="ui-input min-w-0 flex-1"
            aria-label={g.name}
          />
          <button type="submit" disabled={!isOwner} className="ui-btn-secondary px-3">
            {t.common.save}
          </button>
        </Form>
        {!isOwner ? <p className="mt-2 text-[12px] text-muted-foreground">{g.ownerOnly}</p> : null}
        <ActionNote data={actionData} intents={["rename"]} />
        {actionData?.intent === "rename" && actionData.ok ? (
          <p className="mt-2 text-[12.5px] text-muted-foreground">{g.saved}</p>
        ) : null}
      </section>
      <section className="mt-8">
        <h3 className="text-[14px] font-medium">{g.mine}</h3>
        <ul className="mt-2 divide-y divide-border rounded-[10px] border border-border">
          {memberships.map((membership) => {
            const current = membership.workspaceId === workspace.id;
            return (
              <li key={membership.workspaceId} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                  {membership.name}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {roleLabel(t, membership.role)}
                </span>
                {current ? (
                  <span className="rounded-[6px] bg-muted px-2 py-0.5 text-[11.5px] text-secondary">
                    {g.current}
                  </span>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="intent" value="switch" />
                    <input type="hidden" name="workspaceId" value={membership.workspaceId} />
                    <button type="submit" className="ui-btn-secondary px-3 text-[12px]">
                      {g.switch}
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
        <h3 className="text-[14px] font-medium">{g.createTitle}</h3>
        <Form method="post" className="mt-2 flex items-center gap-2">
          <input type="hidden" name="intent" value="create-workspace" />
          <input
            name="name"
            placeholder={g.createPlaceholder}
            maxLength={WORKSPACE_NAME_MAX}
            className="ui-input min-w-0 flex-1"
            aria-label={g.createTitle}
          />
          <button type="submit" className="ui-btn px-3">
            {g.create}
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
  const t = useT();
  const a = t.settings.workspace.api;
  const creating = useBusy("key-create");
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-medium">{a.title}</h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{a.description}</p>
      {!isOwner ? (
        <p className="mt-4 text-[13px] text-muted-foreground">{a.ownerOnly}</p>
      ) : (
        <>
          <Form method="post" className="mt-4 flex items-center gap-2">
            <input type="hidden" name="intent" value="key-create" />
            <input
              name="name"
              placeholder={a.namePlaceholder}
              maxLength={60}
              className="ui-input min-w-0 flex-1"
              aria-label={a.nameLabel}
            />
            <button type="submit" disabled={creating} className="ui-btn px-3">
              {a.issue}
            </button>
          </Form>
          <ActionNote data={actionData} intents={["key-create", "key-revoke"]} />
          {actionData?.intent === "key-create" && actionData.createdKey ? (
            <CopyField value={actionData.createdKey} label={a.createdLabel} />
          ) : null}
          <ul className="mt-4 divide-y divide-border rounded-[10px] border border-border">
            {keys.length === 0 ? (
              <li className="px-3 py-3 text-[12.5px] text-muted-foreground">{a.none}</li>
            ) : (
              keys.map((key) => (
                <li key={key.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate font-medium">{key.name}</span>
                  <span className="font-mono text-muted-foreground">{key.prefix}…</span>
                  <span className="text-muted-foreground">
                    {key.lastUsedAt
                      ? fill(a.lastUsed, { date: key.lastUsedAt.slice(0, 10) })
                      : a.unused}
                  </span>
                  <Form method="post">
                    <input type="hidden" name="intent" value="key-revoke" />
                    <input type="hidden" name="keyId" value={key.id} />
                    <button type="submit" className="ui-btn-ghost px-2 text-[12px]">
                      {t.settings.workspace.members.revoke}
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

function periodEndLabel(t: Dictionary, iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(t.settings.dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Plan and subscription. The row is read from `/api/billing` after mount rather
 * than from the outlet so it reflects a checkout that just completed, and
 * every money action hands off to a Stripe-hosted page.
 */
function BillingRow({ premium }: { premium: boolean }) {
  const t = useT();
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
    setError(await startBilling(t, path));
    setPending(false);
  }

  const isPremium = status ? status.plan === "premium" : premium;
  const paidThrough = periodEndLabel(t, status?.currentPeriodEnd ?? null);

  return (
    <>
      <p className="mt-3 text-[12px] text-muted-foreground">{t.settings.billing.plan}</p>
      <p className="mt-1 text-[13.5px] font-medium">
        {isPremium ? t.settings.billing.premium : t.settings.billing.free}
      </p>
      {status?.comped ? (
        <p className="mt-1 text-[12px] text-muted-foreground">{t.settings.billing.comped}</p>
      ) : null}
      {paidThrough ? (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {status?.status === "canceled"
            ? t.settings.billing.canceledPrefix
            : t.settings.billing.renewsPrefix}{" "}
          {paidThrough}
          {status?.status === "past_due" ? t.settings.billing.pastDueSuffix : ""}
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
            {t.settings.billing.upgrade}
          </button>
        ) : null}
        {status?.manageable ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => go(BILLING_PORTAL_PATH)}
            className="ui-btn-secondary px-3"
          >
            {t.settings.billing.manage}
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

/** The signed-in Google account. Membership lives in workspace_members (docs/spec/workspaces.md). */
function ProfilePanel({ userEmail, premium }: { userEmail: string | null; premium: boolean }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-medium">{t.settings.sections.profile}</h2>
      <div className="mt-4 rounded-[10px] border border-border p-4">
        <p className="text-[12px] text-muted-foreground">{t.settings.profile.account}</p>
        <p className="mt-1 font-mono text-[13.5px]">{userEmail ?? t.settings.profile.unknown}</p>
        <BillingRow premium={premium} />
        <form method="post" action={LOGOUT_PATH} className="mt-4">
          <button type="submit" className="ui-btn">
            {t.common.signOut}
          </button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border p-4">
        <div>
          <p className="text-[13.5px] font-medium">{t.settings.language.title}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {t.settings.language.description}
          </p>
        </div>
        <LanguageSwitcher />
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">{t.settings.profile.note}</p>
    </div>
  );
}

function StubPanel({ section }: { section: SectionId }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[16px] font-medium">{t.settings.sections[section]}</h2>
      <p className="mt-3 text-[13.5px] text-muted-foreground">{t.settings.stub}</p>
    </div>
  );
}
