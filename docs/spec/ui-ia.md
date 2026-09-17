# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app`), **kanban view**, **quick capture** (mobile home at `/app/capture`), **merge**, **research / prototype**, idea detail, team settings.

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

| Viewport               | After mock login           | Primary nav                        |
| ---------------------- | -------------------------- | ---------------------------------- |
| Mobile (`< md`, 768px) | **Capture** `/app/capture` | Bottom nav; 取る first (compose)   |
| Desktop (`md` and up)  | **List** `/app`            | Quiet left sidebar; アイデア first |

`/app` is the desktop list. On a small viewport it paints capture immediately, then client-replaces to `/app/capture` so the 取る tab is active. Mobile 一覧 is `/app/list` (same list, no filter aside by default).

Login has no app shell. Do not treat the gate as the product.

## Login (`/` and `/login`)

Minimal card: app name, 「ログイン」, one Google-looking button. Continues to `/app`. No hint line, product pitch, allowlist essay, or skip-login links.

## Idea list (`/app` desktop home; `/app/list` mobile 一覧)

Empty: title + **まだありません**. Filters / table / kanban appear only when ideas exist, and only from `md` up (Relic-style left filter + table). Mobile list is a simple stack plus a compose FAB.

| Stage      | Japanese   | Role              |
| ---------- | ---------- | ----------------- |
| `spark`    | 着想       | Just caught       |
| `aging`    | 熟成中     | Resting           |
| `ripe`     | 熟した     | Review now        |
| `selected` | 採用       | May be researched |
| `archived` | アーカイブ | Off the board     |

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId` (empty until data exists).

## Quick capture (`/app/capture`, mobile home)

X-like compose on mobile: close (一覧) left, 「置く」 pill right, autofocus textarea, placeholder 「いま思いついたこと」, thin disabled media stub. Light theme (not X dark). Desktop: quiet console panel. Session-local list only; no preloaded ideas.

## Merge (`/app/merge`)

Pick related ideas and stack them. Empty state when there are no ideas.

## Research / prototype (`/app/research`)

Only **selected** ideas. Empty until something is adopted. Workers AI is copy-only; no binding.

## Team (`/app/team`)

Do not invent teammates. Session placeholder (“ログイン中”) only.

Data: `app/data/mock.ts` (empty arrays). Previews: [../ui-previews/](../ui-previews/).
