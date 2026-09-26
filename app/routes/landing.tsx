import { Link, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { googleLoginHref } from "../auth/google-login";
import { BrandMark } from "../components/brand";
import { LanguageSwitcher } from "../components/language-switcher";
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

function SignInButton({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={googleLoginHref(NEW_IDEA_PATH)}
      className={`inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-5 text-[14px] font-semibold text-primary-foreground no-underline hover:opacity-90 ${className}`}
    >
      {t.common.getStarted}
    </a>
  );
}

/** Each hero / CTA headline carries an intentional line break. */
function MultilineHeading({ text, className }: { text: string; className: string }) {
  return (
    <h1 className={className}>
      {text.split("\n").map((line, index) => (
        <span key={line} className="block">
          {index > 0 ? line : line}
        </span>
      ))}
    </h1>
  );
}

function Section({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="ui-title text-[22px] leading-snug md:text-[28px]">{title}</h2>
        {body ? (
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            {body}
          </p>
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

      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
          <span className="inline-flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-[14.5px] font-semibold tracking-[-0.01em]">
              {t.common.appName}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="hidden h-8 items-center rounded-[8px] px-2.5 text-[13px] text-secondary no-underline hover:bg-muted sm:inline-flex"
            >
              {t.common.signIn}
            </Link>
            <a
              href={googleLoginHref(NEW_IDEA_PATH)}
              className="inline-flex h-8 items-center rounded-[8px] bg-primary px-3 text-[13px] font-semibold text-primary-foreground no-underline hover:opacity-90"
            >
              {t.common.getStarted}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="px-6 pt-16 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-[12.5px] font-semibold tracking-wide text-accent uppercase">
              {t.lp.hero.eyebrow}
            </p>
            <MultilineHeading
              text={t.lp.hero.title}
              className="ui-title mt-4 text-[30px] leading-[1.25] tracking-[-0.02em] md:text-[46px]"
            />
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-secondary">
              {t.lp.hero.body}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <SignInButton />
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border-control bg-card px-5 text-[14px] font-semibold text-foreground no-underline hover:bg-row-hover"
              >
                {t.common.signIn}
              </Link>
            </div>
            <p className="mt-4 text-[12.5px] text-muted-foreground">{t.lp.hero.note}</p>
          </div>
        </section>

        <Section title={t.lp.ritual.title} body={t.lp.ritual.body}>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {t.lp.ritual.steps.map((step) => (
              <li
                key={step.step}
                className="rounded-[12px] border border-border-card bg-card p-5 list-none"
              >
                <span className="font-mono text-[12px] text-muted-foreground">{step.step}</span>
                <p className="ui-title mt-2 text-[15.5px]">{step.title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t.lp.features.title} body={t.lp.features.body}>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {t.lp.features.items.map((item) => (
              <li key={item.title} className="rounded-[12px] border border-border-card bg-card p-5">
                <p className="ui-title text-[15px]">{item.title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.lp.stages.title} body={t.lp.stages.body}>
          <ul className="mt-8 flex flex-col gap-2">
            {t.lp.stages.items.map((item, index) => (
              <li
                key={item.label}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[10px] border border-border bg-card px-4 py-3"
              >
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[14px] font-semibold">{item.label}</span>
                <span className="text-[13px] text-muted-foreground">{item.body}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.lp.team.title} body={t.lp.team.body} />

        <section className="border-t border-border px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <MultilineHeading
              text={t.lp.cta.title}
              className="ui-title text-[26px] leading-[1.3] tracking-[-0.02em] md:text-[36px]"
            />
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
              {t.lp.cta.body}
            </p>
            <SignInButton className="mt-8" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
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
