import { useEffect, useState } from "react";
import { Link, useOutletContext, type LoaderFunctionArgs } from "react-router";
import { LOGOUT_PATH } from "../../auth/google-login";
import type { AppData } from "./layout";
import { MEMBERS, SESSION_USER } from "../../data/mock";
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
import type { Route } from "./+types/settings";

/** Order and grouping only: the copy comes from `t.settings.sections`. */
const SECTIONS = [
  { id: "members", group: "workspace" },
  { id: "general", group: "workspace" },
  { id: "team", group: "workspace" },
  { id: "stages", group: "workspace" },
  { id: "profile", group: "personal" },
  { id: "notify", group: "personal" },
  { id: "shortcuts", group: "personal" },
] as const satisfies readonly {
  id: keyof Dictionary["settings"]["sections"];
  group: keyof Dictionary["settings"]["groups"];
}[];

type SectionId = (typeof SECTIONS)[number]["id"];

export function loader({ context }: LoaderFunctionArgs) {
  return { locale: context.locale };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").settings.metaTitle }];
}

export default function SettingsPage() {
  const { userEmail, premium } = useOutletContext<AppData>();
  const t = useT();
  const [section, setSection] = useState<SectionId>("members");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-border px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Link
          to={LIST_PATH}
          className="flex min-h-11 min-w-[3.5rem] items-center text-[13.5px] font-medium text-foreground no-underline"
        >
          {t.common.back}
        </Link>
        <h1 className="text-[13.5px] font-semibold">{t.settings.title}</h1>
        <span className="min-w-[3.5rem]" />
      </header>
      <aside className="w-full shrink-0 border-b border-border px-3 py-4 md:w-52 md:border-b-0 md:border-r">
        <p className="hidden px-2 text-[16px] font-medium md:block">{t.settings.title}</p>
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
                      ? "bg-muted font-semibold text-foreground"
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
          <MembersPanel userEmail={userEmail} />
        ) : section === "profile" ? (
          <ProfilePanel userEmail={userEmail} premium={premium} />
        ) : (
          <StubPanel section={section} />
        )}
      </div>
    </div>
  );
}

function MembersPanel({ userEmail }: { userEmail: string | null }) {
  const t = useT();
  const rows =
    MEMBERS.length === 0
      ? [
          {
            name: userEmail ?? t.common.sessionUser,
            email: userEmail ?? "",
            role: SESSION_USER.role,
          },
        ]
      : MEMBERS;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium">{t.settings.sections.members}</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {t.settings.members.description}
          </p>
        </div>
        <button
          type="button"
          disabled
          className="ui-btn opacity-40"
          title={t.settings.members.inviteDisabled}
        >
          {t.settings.members.invite}
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[10px] border border-border">
        <table className="ui-table">
          <thead>
            <tr>
              <th>{t.settings.members.columns.member}</th>
              <th>{t.settings.members.columns.role}</th>
              <th>{t.settings.members.columns.lastSeen}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <tr key={member.name}>
                <td>
                  <div className="flex items-center gap-2.5 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-muted font-mono text-[11px] text-secondary">
                      {initialsFromLabel(member.name)}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-semibold">{member.name}</span>
                      {member.email ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {member.email}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="text-[13px] text-muted-foreground">
                  {member.role === "owner"
                    ? t.settings.members.roles.owner
                    : t.settings.members.roles.member}
                </td>
                <td className="font-mono text-[11.5px] text-muted-foreground">
                  {t.settings.members.online}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-8">
        <h3 className="text-[16px] font-medium">{t.settings.members.visibility.heading}</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-[10px] border border-border-card bg-sunken p-3">
            <p className="text-[13.5px] font-medium">{t.settings.members.visibility.team.title}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t.settings.members.visibility.team.body}
            </p>
          </div>
          <div className="rounded-[10px] border border-border p-3">
            <p className="text-[13.5px] font-medium">
              {t.settings.members.visibility.author.title}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t.settings.members.visibility.author.body}
            </p>
          </div>
          <div className="rounded-[10px] border border-border p-3">
            <p className="text-[13.5px] font-medium">
              {t.settings.members.visibility.workspace.title}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t.settings.members.visibility.workspace.body}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {t.settings.members.visibility.note}
        </p>
      </section>
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
      <p className="mt-1 text-[13.5px] font-semibold">
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

/** The signed-in Google account. Membership lives in ACCESS_ALLOWED_EMAILS, not in D1. */
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
