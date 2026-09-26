import { Link, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { googleLoginHref } from "../auth/google-login";
import { BrandMark } from "../components/brand";
import { LanguageSwitcher } from "../components/language-switcher";
import { AppPreview } from "../components/landing/app-preview";
import { FEATURE_ART, StageRail } from "../components/landing/visuals";
import { dictionary } from "../i18n/dictionary";
import { useT } from "../i18n/context";
import { NEW_IDEA_PATH } from "../lib/home-path";
import { safeNextPath } from "../lib/next-path";
import type { Route } from "./+types/landing";

/**
 * Public front door. Signed in, `/` is not a marketing page — it is the app,
 * so we redirect the way Money Forward does rather than render a second home.
 */
export function loader({ context, request }: LoaderFunctionArgs) {
  if (context.userEmail) {
    const next = new URL(request.url).searchParams.get("next");
    throw redirect(safeNextPath(next, "/app"));
  }
  return { locale: context.locale };
}

export function meta({ data }: Route.MetaArgs) {
  const t = dictionary(data?.locale ?? "ja");
  return [
    { title: t.lp.metaTitle },
    { name: "description", content: t.lp.metaDescription },
    { property: "og:title", content: t.lp.metaTitle },
    { property: "og:description", content: t.lp.metaDescription },
    { property: "og:type", content: "website" },
  ];
}

/** The one action we want on every screenful. `variant` picks dark vs light band. */
function SignInButton({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const t = useT();
  const base =
    variant === "dark"
      ? "lp-btn"
      : "inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-5 text-[14px] font-semibold text-primary-foreground no-underline hover:opacity-90";
  return (
    <a href={googleLoginHref(NEW_IDEA_PATH)} className={`${base} ${className}`}>
      {t.common.getStarted}
    </a>
  );
}

/** Each hero / CTA headline carries an intentional line break. */
function MultilineHeading({
  text,
  className,
  as: Tag = "h1",
}: {
  text: string;
  className: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag className={className}>
      {text.split("\n").map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </Tag>
  );
}

function Section({
  title,
  body,
  children,
  tone = "plain",
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
  tone?: "plain" | "sunken";
}) {
  return (
    <section
      className={`border-t border-border px-6 py-16 md:py-24 ${tone === "sunken" ? "bg-muted" : ""}`}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="ui-title text-[24px] leading-snug tracking-[-0.02em] md:text-[32px]">
          {title}
        </h2>
        {body ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{body}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { locale } = useLoaderData<typeof loader>();
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main" className="sr-only">
        {t.lp.skipToContent}
      </a>

      <main id="main">
        {/* One dark band for the hero. The header lives outside it because
            `.lp-dark` clips (overflow: hidden), which would kill `sticky`. */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020] text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
            <span className="inline-flex min-w-0 items-center gap-2">
              <BrandMark className="h-6 w-6 shrink-0" />
              {/* Phones give the row to the language switcher and the CTA; the
                  mark alone still says whose page this is. */}
              <span className="hidden truncate text-[14.5px] font-semibold tracking-[-0.01em] sm:inline">
                {t.common.appName}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher />
              <Link
                to="/login"
                className="hidden h-8 items-center rounded-[8px] px-2.5 text-[13px] text-white/75 no-underline hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                {t.common.signIn}
              </Link>
              <a
                href={googleLoginHref(NEW_IDEA_PATH)}
                className="inline-flex h-8 shrink-0 items-center rounded-[8px] bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-[#101828] no-underline hover:bg-[#e9eaff]"
              >
                {t.common.getStarted}
              </a>
            </div>
          </div>
        </header>

        <div className="lp-dark px-6 pt-16 pb-36 md:pt-24 md:pb-52">
          <div className="lp-rise mx-auto max-w-4xl text-center">
            <span className="lp-chip">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-spark" aria-hidden="true" />
              {t.lp.hero.eyebrow}
            </span>
            <MultilineHeading
              text={t.lp.hero.title}
              className="lp-gradient-text mt-6 text-[34px] leading-[1.2] font-semibold tracking-[-0.03em] md:text-[58px]"
            />
            <p className="mx-auto mt-6 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
              {t.lp.hero.body}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <SignInButton variant="dark" />
              <Link to="/login" className="lp-btn-ghost">
                {t.common.signIn}
              </Link>
            </div>
            <p className="mt-4 text-[12.5px] text-white/50">{t.lp.hero.note}</p>
          </div>
        </div>

        {/* The shot straddles the seam: half on the dark band, half on the page. */}
        <div className="px-4 sm:px-6">
          <div
            className="lp-rise mx-auto -mt-28 max-w-6xl md:-mt-44"
            style={{ animationDelay: "120ms" }}
          >
            <AppPreview />
          </div>
        </div>

        <Section title={t.lp.ritual.title} body={t.lp.ritual.body}>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {t.lp.ritual.steps.map((step) => (
              <li
                key={step.step}
                className="list-none rounded-[14px] border border-border-card bg-card p-6"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 font-mono text-[12px] font-semibold text-accent">
                  {step.step}
                </span>
                <p className="ui-title mt-4 text-[16px]">{step.title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t.lp.features.title} body={t.lp.features.body} tone="sunken">
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.lp.features.items.map((item, index) => {
              const Art = FEATURE_ART[index];
              return (
                <li
                  key={item.title}
                  className="flex flex-col rounded-[14px] border border-border-card bg-card p-4"
                >
                  {Art ? <Art /> : null}
                  <p className="ui-title mt-4 px-1 text-[15px]">{item.title}</p>
                  <p className="mt-2 px-1 pb-1 text-[13.5px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={t.lp.stages.title} body={t.lp.stages.body}>
          <StageRail />
        </Section>

        <Section title={t.lp.team.title} body={t.lp.team.body} tone="sunken" />

        <section className="lp-dark px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <MultilineHeading
              as="h2"
              text={t.lp.cta.title}
              className="lp-gradient-text text-[28px] leading-[1.25] font-semibold tracking-[-0.02em] md:text-[42px]"
            />
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
              {t.lp.cta.body}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <SignInButton variant="dark" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2">
              <BrandMark className="h-5 w-5" />
              <span className="text-[13px] font-semibold">{t.common.appName}</span>
            </span>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">{t.lp.footer.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="font-mono text-[11.5px] text-muted-foreground" lang={locale}>
              {t.lp.footer.copyright(year)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
