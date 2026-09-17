# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app/list`), **kanban view**, **quick capture** (mobile home at `/app`), **merge**, **research / prototype**, idea detail, team settings.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome follows **LiteLLM Admin light**: gray sidebar, white main, thin `#E5E7EB` borders, charcoal primary button, almost no shadow. Idea list IA follows **Relic IDEATION Cloud** in-app (left filter + dense table + pastel pills) **when rows exist**. Do **not** copy Relic’s blue marketing LP.

| Token          | Intent                                                  |
| -------------- | ------------------------------------------------------- |
| Sidebar        | Light gray (`#F3F4F6`)                                  |
| Main           | White                                                   |
| Panels / table | White, `#E5E7EB` border, no shadow                      |
| Primary        | Charcoal, white label                                   |
| Type           | Inter + IBM Plex Sans JP                                |
| Pills          | Pastel chips for stage/tags only. No fake S/A/B scores. |

Empty workspace: no dummy cards, no filter chrome. Copy is **まだありません**.

## Responsive homes (X-like split)

X mobile web is login-walled; after auth, Idea Cloud still uses X’s IA split: compose-first on the phone, timeline/list on desktop.

| Viewport               | After entering `/app` | Primary nav                        |
| ---------------------- | --------------------- | ---------------------------------- |
| Mobile (`< md`, 768px) | **Capture** `/app`    | Bottom nav; 取る first (compose)   |
| Desktop (`md` and up)  | **List** `/app/list`  | Quiet left sidebar; アイデア first |

`/app` is capture-only (mobile home). Desktop client-replaces to `/app/list`. Mobile 一覧 is `/app/list` with フィルタ collapsed.

Login has no app shell. Do not treat the gate as the product.

## Login (`/` and `/login`)

Minimal card: app name, 「ログイン」, one Google-looking button. Continues to `/app`. No hint line, product pitch, allowlist essay, or skip-login links.

## Idea list (`/app/list`, desktop home)

Empty: title + **まだありません**. Filters / table / kanban appear only when ideas exist, and only from `md` up (Relic-style left filter + table). Mobile list is a stack; フィルタ stays closed until tapped.

| Stage      | Japanese   | Role              |
| ---------- | ---------- | ----------------- |
| `spark`    | 着想       | Just caught       |
| `aging`    | 熟成中     | Resting           |
| `ripe`     | 熟した     | Review now        |
| `selected` | 採用       | May be researched |
| `archived` | アーカイブ | Off the board     |

Route: `app/routes/app/board.tsx` (loader reads D1 `ideas`). Detail: `/app/ideas/:ideaId` (loader reads the saved row). Empty **まだありません** when the table has no rows.

## Quick capture (`/app` and `/app/capture`, mobile home)

X-like compose on mobile (light console, not X dark): back chevron left, 「置く」 pill right, avatar + autofocus textarea, placeholder 「いま思いついたこと」, thin disabled media stubs under the composer. No bottom nav on this screen — back opens 一覧. Desktop: quiet console panel.

**置く** INSERTs into D1 and redirects to `/app/list`. Auth is still mock; there is no per-user ownership.

## Merge (`/app/merge`)

Pick related ideas and stack them. Empty state when there are no ideas.

## Research / prototype (`/app/research`)

Only **selected** ideas. Empty until something is adopted. Workers AI is copy-only; no binding.

## Team (`/app/team`)

Do not invent teammates. Session placeholder (“ログイン中”) only.

List/detail data: D1 `ideas`. Stage labels and empty merge/research/team shells still use `app/data/mock.ts` (no seed rows). Previews: [../ui-previews/](../ui-previews/).
