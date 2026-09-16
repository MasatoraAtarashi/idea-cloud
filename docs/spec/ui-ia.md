# UI information architecture

Product UI copy is **Japanese**. This spec is English.

There is **no public landing page**. `/` redirects to `/login`. The product is empty until someone captures an idea.

Working screens: **login**, **capture**, **idea table**, **merge**, **research / prototype**, plus idea detail and team settings as shell.

## Visual language

LiteLLM dashboard default is **light**. Not a marketing kanban, and not the template gray-50 / blue-600 todos.

| Token   | Intent                                                       |
| ------- | ------------------------------------------------------------ |
| Canvas  | Off-white                                                    |
| Panels  | White, cool gray-blue border (`#dcddeb`)                     |
| Primary | Near-navy, white label                                       |
| Sidebar | White; grouped nav; active item = muted fill + left navy bar |
| Type    | Inter + IBM Plex Sans JP                                     |
| Density | Quiet console (table, not Trello)                            |

Desktop (~1280px): left sidebar. Mobile (~390px): bottom nav, **取る (capture) first**. `/login` has no app shell.

## Login (`/` → `/login`)

First screen. Product name and **Google でログイン** only. No marketing copy, env-var names, “back to top”, or “skip login”. Mock click still goes to `/app` until real OAuth exists.

Route: `app/routes/login.tsx`. `/` is `app/routes/home.tsx` (redirect).

## Quick capture (`/app/capture`)

Mobile-first inbox. One textarea, no tags, no stage picker.

- Submit is disabled until there is text (navy button looks muted when empty).
- Copy tells the user to put the thought down and forget it.
- Does not persist (session list only).

Route: `app/routes/app/capture.tsx`.

## Idea list (`/app`)

Default view is a **table** (title, stage, tags, age) with a search / stage toolbar, LiteLLM Virtual Keys density. Empty body: **まだアイデアはない** plus a capture CTA. Kanban is a secondary toggle of the same empty data — not the home view.

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId` (empty / not found uses the same capture CTA).

Stages remain:

| Stage | Japanese | Role |
| --- | --- |
| `spark` | 着想 | Just caught |
| `aging` | 熟成中 | Resting |
| `ripe` | 熟した | Review now |
| `selected` | 採用 | May be researched |
| `archived` | アーカイブ | Off the board |

## Merge (`/app/merge`)

Stack two related ideas into one. Empty until capture. No writes.

Route: `app/routes/app/merge.tsx`.

## Research / prototype (`/app/research`)

Only **selected** ideas. Empty until something is adopted. Workers AI is copy-only; no binding.

Route: `app/routes/app/research.tsx`.

## Other shell screens

| Path             | Job                                            |
| ---------------- | ---------------------------------------------- |
| `/login`         | Real-looking Google gate; mock CTA into `/app` |
| `/app/ideas/:id` | Body, tags, next actions — empty until capture |
| `/app/team`      | Empty allowlist UI, no invented members        |

Catalog: `app/data/mock.ts` (`IDEAS` is `[]`). Previews: [../ui-previews/](../ui-previews/).
