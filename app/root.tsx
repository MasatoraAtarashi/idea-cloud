import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  type LoaderFunctionArgs,
} from "react-router";

import type { Route } from "./+types/root";
import { I18nProvider } from "./i18n/context";
import { dictionary } from "./i18n/dictionary";
import { DEFAULT_LOCALE, LOCALE_HTML_LANG, type Locale } from "./i18n/locale";
import "./app.css";

/** UI: IBM Plex Sans JP 400–700. Numbers, time, ids, labels: IBM Plex Mono 400–600. */

const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+JP:wght@400;500;600;700&display=swap";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  { rel: "preload", as: "style", href: FONT_STYLESHEET },
];

/** The locale the Worker resolved. Every route can read it via `useT()`. */
export function loader({ context }: LoaderFunctionArgs) {
  return { locale: context.locale };
}

/** Also correct inside the ErrorBoundary, where the root loader may not have run. */
function useRootLocale(): Locale {
  const data = useRouteLoaderData<typeof loader>("root");
  return data?.locale ?? DEFAULT_LOCALE;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const locale = useRootLocale();
  return (
    <html lang={LOCALE_HTML_LANG[locale]}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
        <link
          rel="stylesheet"
          href={FONT_STYLESHEET}
          media="print"
          onLoad={(event) => {
            event.currentTarget.media = "all";
          }}
        />
        <noscript>
          <link rel="stylesheet" href={FONT_STYLESHEET} />
        </noscript>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <I18nProvider locale={loaderData.locale}>
      <Outlet />
    </I18nProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = dictionary(useRootLocale());
  let message = t.errors.title;
  let details = t.errors.unexpected;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? t.errors.notFound : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="ui-title text-2xl">{message}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{details}</p>
      {stack && (
        <pre className="ui-panel mt-6 overflow-x-auto p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
