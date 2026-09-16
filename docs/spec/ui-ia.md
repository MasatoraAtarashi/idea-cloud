# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login**, **idea list**, **quick capture**, **merge**, **research / prototype**, plus idea detail and team settings. There is **no public landing page**.

## Visual language

Two references, split on purpose:

| Layer          | Reference             | What to copy                                                                                                     |
| -------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Shell / chrome | LiteLLM Admin (light) | Left sidebar with grouped nav, white canvas, thin gray borders, near-black primary, breadcrumbs, table quietness |
| Idea list      | Relic IDEATION Cloud  | Left filter panel + dense table, pastel stage chips, tag pills, Japanese density                                 |
| Accent only    | Relic blue gradient   | Brand mark on the sidebar / login. Never the whole app chrome                                                    |
| Mode           | Light only            | No dark theme                                                                                                    |

LiteLLM glass / Relic marketing gradients are **not** the app background.

| Token   | Intent                                        |
| ------- | --------------------------------------------- |
| Canvas  | Off-white (`#f7f8fa`)                         |
| Panels  | White, thin gray border (`#e4e4e7`)           |
| Primary | Near-black, white label                       |
| Sidebar | White; active item = muted fill (no navy bar) |
| Type    | Inter + IBM Plex Sans JP                      |
| Density | Quiet console + Relic table                   |

Desktop (~1280px): left sidebar. Mobile (~390px): bottom nav, **取る (capture) first**. `/login` has no app shell.

## Root (`/`)

Redirects to `/login`. No marketing copy, stage map, or screen map.

Route: `app/routes/home.tsx`.

## Login (`/login`)

Quiet Sign in with Google mock. Button look stays the official Google CTA. Click-through goes to `/app` with an **empty** idea list.

Route: `app/routes/login.tsx`.

## Idea list (`/app`)

Home of the signed-in app. Relic-like **filters + table**, not a five-column kanban of cards.

| Stage | Japanese | Role |
| --- | --- |
| `spark` | 着想 | Just caught |
| `aging` | 熟成中 | Resting |
| `ripe` | 熟した | Review now |
| `selected` | 採用 | May be researched |
| `archived` | アーカイブ | Off the list by default habit |

Until D1 persistence exists, the table is an **empty state** (no fixture titles, authors, tags, or ages).

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId`.

## Quick capture (`/app/capture`)

Mobile-first inbox. One textarea, no tags, no stage picker.

- Submit is disabled until there is text.
- Copy tells the user to put the thought down and forget it.
- Does not persist (session list on this page only).

Route: `app/routes/app/capture.tsx`.

## Merge (`/app/merge`)

Stack two related ideas into one. Empty until real ideas exist. No writes.

Route: `app/routes/app/merge.tsx`.

## Research / prototype (`/app/research`)

Only **selected** ideas. Tabs (LiteLLM audit-log style) for research notes vs a tiny prototype plan. Empty until something is selected. Workers AI is unwired.

Route: `app/routes/app/research.tsx`.

## Other shell screens

| Path             | Job                                                                  |
| ---------------- | -------------------------------------------------------------------- |
| `/login`         | Google mock CTA into `/app`                                          |
| `/app/ideas/:id` | Body, tags, next actions — empty/not found without real rows         |
| `/app/team`      | Members (empty), OAuth vs allowlist, disabled allowlist, crypto stub |

Idea fixtures: `app/data/mock.ts` (empty arrays). Previews: [../ui-previews/](../ui-previews/).
