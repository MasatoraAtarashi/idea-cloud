# End-to-end tests

Playwright covers the mocked-auth product loop against a local Vite/dev Worker and local D1. There is no real Google OAuth.

## Run locally

```bash
pnpm install
cp .dev.vars.example .dev.vars   # LOCAL_DEV_USER_EMAIL is enough; no OAuth secrets
pnpm db:migrate:local
pnpm test:e2e
```

`pnpm test:e2e` starts `pnpm dev` on `127.0.0.1:5173` (or reuses one that is already running), applies local D1 migrations, and runs Chromium headed:false.

Mobile project: 390×844 (iPhone UA, compose-first). Desktop project: 1280×800 (list-first). Tests run with **one worker** so they do not race the shared local D1.

First time on a machine:

```bash
pnpm exec playwright install chromium
```

CI installs Chromium with OS deps in `.github/workflows/pr.yml` (`E2E (Playwright)`).

## What is asserted

Happy paths: create idea (mobile `/app` compose or desktop header +), list, detail edit, stage advance, comment, detail **相談** tab (heading **AIと話す** and starter chips; no live model call), mobile tabs (一覧 / インスピレーション / 分析), inspiration memo, analytics charts/counts.

Creates fill a dummy `e2e` tag so create-time auto-tag AI is not required. Desktop compose retries the header + click until the dialog hydrates (SSR buttons are inert before React attaches).

**Workers AI / TypeSafe Jev / Brave Search are not called with secrets.** Local Vite sets `remoteBindings: false`, and CI has no `TYPESAFE_API_KEY` or `SEARCH_API_KEY`. The research test opens the リサーチ tab (live-search callout) and expects the Japanese fail-soft copy (`リサーチに失敗しました…`) when Workers AI is unavailable. Public HTML search may run and fail soft; the test must not crash or call a paid API.

Reports: `playwright-report/` (HTML) and `test-results/` on failure. Both are gitignored.
