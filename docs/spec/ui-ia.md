# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home), **kanban view**, **quick capture** (mobile home), **merge**, **research / prototype**, idea detail, team settings.

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

Same product, different default surface — like X mobile compose vs desktop timeline.

| Viewport               | After mock login (`/app`)  | Primary nav                        |
| ---------------------- | -------------------------- | ---------------------------------- |
| Mobile (`< md`, 768px) | **Capture** `/app/capture` | Bottom nav; 取る first (compose)   |
| Desktop (`md` and up)  | **List** `/app/list`       | Quiet left sidebar; アイデア first |

`/app` paints the right surface with CSS, then client-replaces to `/app/capture` or `/app/list` so the URL matches nav.

Login has no app shell.

## Login (`/` and `/login`)

Minimal card: app name, 「ログイン」, one Google-looking button. Continues to `/app`. No hint line, product pitch, allowlist essay, or skip-login links.

## Idea list (`/app/list`, desktop home)

Empty: title + **まだありません**. Filters / table / kanban appear only when ideas exist (Relic-style left filter + table). Mobile list is a simple stack plus a compose FAB.

| Stage      | Japanese   | Role              |
| ---------- | ---------- | ----------------- |
| `spark`    | 着想       | Just caught       |
| `aging`    | 熟成中     | Resting           |
| `ripe`     | 熟した     | Review now        |
| `selected` | 採用       | May be researched |
| `archived` | アーカイブ | Off the board     |

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId` (empty until data exists).

## Quick capture (`/app/capture`, mobile home)

Mobile: compose-first (X-like). Large textarea, top-right 「置く」, bottom nav with a primary compose control. Desktop: quiet console panel. Session-local list only; no preloaded ideas.

## Merge (`/app/merge`)

Pick related ideas and stack them. Empty state when there are no ideas.

## Research / prototype (`/app/research`)

Only **selected** ideas. Empty until something is adopted. Workers AI is copy-only; no binding.

## Team (`/app/team`)

Do not invent teammates. Session placeholder (“ログイン中”) only. Disabled allowlist stub.

Data: `app/data/mock.ts` (empty arrays). Previews: [../ui-previews/](../ui-previews/).
