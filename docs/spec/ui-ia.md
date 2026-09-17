# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app/list`), **kanban view**, **new idea compose** (mobile home at `/app`; desktop modal), idea detail, **settings** (team / access). Merge and research exist as **per-idea actions** (deep links), not primary destinations.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome is **Linear-quiet**: dense type, keyboard-first, minimal sidebar, plus-to-compose. Color density follows **Relic IDEATION Cloud in-app** (cool canvas, pastel stage/tag pills, clearer table hierarchy and hover). Do **not** copy Relic’s blue marketing LP, Relic’s logo, or X dark mode.

| Token          | Intent                                                              |
| -------------- | ------------------------------------------------------------------- |
| Sidebar        | Cool gray-blue (`#E8EEF6`)                                          |
| Main           | Cool off-white (`#F5F7FB`)                                          |
| Panels / table | White, `#D9E1EE` border, tinted header, row hover                   |
| Primary        | Charcoal (`#2A3548`), white label                                   |
| Type           | Inter-like Latin + quiet JP (`system-ui` / Hiragino / Noto Sans JP) |
| Brand          | Original SVG cloud + spark mark, wordmark 「アイデアクラウド」      |
| Pills          | Pastel chips for stage/tags only. No fake S/A/B scores.             |

Empty workspace still shows **view chrome** (filters, table or board shell). Copy inside the empty row is **まだありません**.

## Brand

Sidebar header, mobile top bar (non-compose), and login gate use the same mark + wordmark. Geometry is a flat cloud with a pastel spark — not Relic’s mark and not an X bird.

## Responsive homes

| Viewport               | After entering `/app` | Primary nav                                         |
| ---------------------- | --------------------- | --------------------------------------------------- |
| Mobile (`< md`, 768px) | **New idea** `/app`   | Bottom nav: 一覧 + 新規 + 設定                      |
| Desktop (`md` and up)  | **List** `/app/list`  | Quiet left sidebar; アイデア + plus; 設定 in footer |

`/app` is compose-only (mobile home). Desktop client-replaces to `/app/list`. Mobile 一覧 is `/app/list` with フィルタ collapsed.

Login has no app shell. Do not treat the gate as the product.

## Login (`/` and `/login`)

Minimal card: brand mark + 「アイデアクラウド」, 「ログイン」, one Google-looking button. Continues to `/app`. No hint line, product pitch, allowlist essay, or skip-login links.

## Idea list (`/app/list`, desktop home)

Always show list/board chrome (view toggle, search, filter rail, table headers or kanban columns), including when there are **0 ideas**. Empty row/column copy: **まだありません**. Filters stay available from `md` up (left filter + table). Mobile list is a stack; フィルタ stays closed until tapped.

Row menu (⋯) and idea detail expose **融合** and **リサーチ** as per-idea actions. Research may be disabled until stage is **採用**. Stub flows are OK.

| Stage      | Japanese   | Role              |
| ---------- | ---------- | ----------------- |
| `spark`    | 着想       | Just caught       |
| `aging`    | 熟成中     | Resting           |
| `ripe`     | 熟した     | Review now        |
| `selected` | 採用       | May be researched |
| `archived` | アーカイブ | Off the board     |

Route: `app/routes/app/board.tsx` (loader reads D1 `ideas`). Detail: `/app/ideas/:ideaId` (loader reads the saved row).

## New idea (`/app`, `/app/capture`, desktop modal)

Not a desktop nav tab. Desktop: plus in the sidebar header (and `⌘N` / `Ctrl+N`) opens a compose modal; `⌘Enter` / `Ctrl+Enter` submits. Mobile: compose-first home at `/app` — back chevron left, title 「新規アイデア」, 「作成」 right, avatar + autofocus textarea, placeholder 「いま思いついたこと」, thin disabled media stubs. No bottom nav on this screen — back opens 一覧.

`/app/capture` remains a deep-link alias (desktop: open modal on the list). Do not label the product 「キャプチャ」.

**作成** INSERTs into D1 and redirects to `/app/list`. Auth is still mock; there is no per-user ownership.

## Merge / research (not primary nav)

`/app/merge` and `/app/research` are deep links from idea actions only. Do not advertise them in the sidebar or mobile bottom nav. Empty state when there is nothing to merge or no **selected** ideas.

## Settings (`/app/settings`)

Team and access live here — not a top-level 「アクセス」 section. `/app/team` redirects to settings. Do not invent teammates. Session placeholder (“ログイン中”) only.

List/detail data: D1 `ideas`. Stage labels and empty merge/research/settings shells still use `app/data/mock.ts` (no seed rows). Previews: [../ui-previews/](../ui-previews/).
