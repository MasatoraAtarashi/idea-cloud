import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
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

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "エラー";
  let details = "予期しないエラーが起きました。";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "ページが見つかりませんでした。" : error.statusText || details;
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
