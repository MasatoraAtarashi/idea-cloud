# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens for this pass: **landing page**, **quick capture**, **maturation kanban**, **merge**, **research / prototype**, plus login, idea detail, and team settings as shell.

## Visual language

LiteLLM dashboard default is **light**. Not the first dark+gold experiment, and not the template gray-50 / blue-600 todos.

| Token | Intent |
| --- | --- |
| Canvas | Off-white |
| Panels | White, cool gray-blue border (`#dcddeb`) |
| Primary | Near-navy, white label |
| Sidebar | White; active item = muted fill + left navy bar |
| Type | Inter + IBM Plex Sans JP |
| Density | Quiet console |

Desktop (~1280px): left sidebar. Mobile (~390px): bottom nav, **取る (capture) first**. LP and `/login` have no app shell.

## Landing page (`/`)

Public Japanese LP. Thesis: capture quickly, do not polish in the moment, review after time.

- Hero + four steps (catch → age → review → evolve).
- Stage strip (着想 → アーカイブ).
- Screen map links into the mock app.
- **Must stay Cloudflare Access bypass** so marketing is public.

Route: `app/routes/home.tsx`.

## Quick capture (`/app/capture`)

Mobile-first inbox. One textarea, no tags, no stage picker.

- Submit is disabled until there is text (navy button looks muted when empty).
- Copy tells the user to put the thought down and forget it.
- Does not persist (mock list in memory only).

Route: `app/routes/app/capture.tsx`.

## Maturation kanban (`/app`)

Shelf for time, not a sprint board. Five columns:

| Stage | Japanese | Role |
| --- | --- |
| `spark` | 着想 | Just caught |
| `aging` | 熟成中 | Resting |
| `ripe` | 熟した | Review now |
| `selected` | 採用 | May be researched |
| `archived` | アーカイブ | Off the board |

Cards show title, age in days, and a couple of tags. Default habit: do not open young cards. Desktop is for this view.

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId`.

## Merge (`/app/merge`)

Stack two related ripe ideas into one. Mock picker + “overlap” copy. No writes.

Route: `app/routes/app/merge.tsx`.

## Research / prototype (`/app/research`)

Only **selected** ideas. Tabs for research notes vs a tiny prototype plan. Workers AI is copy-only; no binding.

Route: `app/routes/app/research.tsx`.

## Other shell screens

| Path | Job |
| --- | --- |
| `/login` | Access is the early gate; mock CTA into `/app` |
| `/app/ideas/:id` | Body, tags, next actions (mock) |
| `/app/team` | Members, Access vs OAuth, disabled allowlist, crypto stub |

Mock data: `app/data/mock.ts`. Previews: [../ui-previews/](../ui-previews/).
