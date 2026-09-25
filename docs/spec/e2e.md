# End-to-end tests

Playwright covers the product loop against a local Vite/dev Worker and local D1. Sign-in uses the **localhost dev path** of the real gate: with no `GOOGLE_CLIENT_ID`, `/api/auth/google` signs `LOCAL_DEV_USER_EMAIL` in and sets the same session cookie the OAuth callback would. Google itself is never contacted ([oauth-swap.md](./oauth-swap.md)).

## Run locally

```bash
pnpm install
cp .dev.vars.example .dev.vars   # LOCAL_DEV_USER_EMAIL is enough; no OAuth secrets
pnpm db:migrate:local
pnpm test:e2e
```

`pnpm test:e2e` starts `pnpm dev` on `127.0.0.1:5173` (or reuses one that is already running), applies local D1 migrations, and runs Chromium headed:false.

A `setup` project (`e2e/auth.setup.ts`) signs in once and saves the session to `e2e/.auth/state.json` (gitignored); the mobile and desktop projects depend on it and load that storage state, so every spec starts signed in. `continuePastLogin` clears cookies first when a test wants to exercise the gate itself.

Mobile project: 390×844 (iPhone UA, compose-first). Desktop project: 1280×800 (list-first). Tests run with **one worker** so they do not race the shared local D1.

First time on a machine:

```bash
pnpm exec playwright install chromium
```

CI installs Chromium with OS deps in `.github/workflows/pr.yml` (`E2E (Playwright)`).

## What is asserted

Happy paths: create idea (mobile `/app` compose or desktop header +), list, detail edit, stage advance, comment, **コピー** (title and body on the clipboard), detail **相談** tab (heading **AIと話す**, starter chips, send, Japanese fail-soft when Workers AI is down, user turn still present after reload), mobile tabs (一覧 / インスピレーション / 分析), inspiration memo, inspiration URL-only create (http paste, no title), analytics charts/counts.

Creates fill a dummy `e2e` tag so create-time auto-tag AI is not required. Desktop compose retries the header + click until the dialog hydrates (SSR buttons are inert before React attaches).

**Workers AI / TypeSafe Jev / Brave Search are not called with secrets.** Local Vite sets `remoteBindings: false`, and CI has no `TYPESAFE_API_KEY` or `SEARCH_API_KEY`. The research test opens the リサーチ tab (live-search callout) and expects the Japanese fail-soft copy (`リサーチに失敗しました…`) when Workers AI is unavailable. Public HTML search may run and fail soft; the test must not crash or call a paid API.

Reports: `playwright-report/` (HTML) and `test-results/` on failure. Both are gitignored.
