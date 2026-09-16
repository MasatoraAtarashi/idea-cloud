# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (default), **kanban view**, **quick capture**, **merge**, **research / prototype**, idea detail, team settings.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome follows **LiteLLM Admin light**: gray sidebar, white main, thin `#E5E7EB` borders, charcoal primary button, almost no shadow. Idea list IA follows **Relic IDEATION Cloud** in-app (left filter + dense table + pastel pills). Do **not** copy Relic’s blue marketing LP.

| Token          | Intent                                                  |
| -------------- | ------------------------------------------------------- |
| Sidebar        | Light gray (`#F3F4F6`)                                  |
| Main           | White                                                   |
| Panels / table | White, `#E5E7EB` border, no shadow                      |
| Primary        | Charcoal, white label                                   |
| Type           | Inter + IBM Plex Sans JP                                |
| Pills          | Pastel chips for stage/tags only. No fake S/A/B scores. |

Desktop (~1280px): left grouped sidebar. Mobile (~390px): bottom nav, **取る (capture) first**. Login has no app shell.

## Login (`/` and `/login`)

Quiet Google-looking mock. Button continues to `/app` for screen review. Real in-app Google OAuth is later. No philosophy essay, screen map, mock banners, or “skip login” links.

## Idea list (`/app`)

Primary view: Relic-style console — left filter (keyword, stage, tags) + table columns (title, stage, tags, age). Empty until real data exists. Kanban is a secondary view, not the default.

| Stage      | Japanese   | Role              |
| ---------- | ---------- | ----------------- |
| `spark`    | 着想       | Just caught       |
| `aging`    | 熟成中     | Resting           |
| `ripe`     | 熟した     | Review now        |
| `selected` | 採用       | May be researched |
| `archived` | アーカイブ | Off the board     |

Route: `app/routes/app/board.tsx`. Detail: `/app/ideas/:ideaId` (empty/not-found until data exists).

## Quick capture (`/app/capture`)

Mobile-first inbox. One textarea. Submit disabled until there is text. Session-local list only; no preloaded ideas.

## Merge (`/app/merge`)

Pick related ideas and stack them. Empty state when there are no ideas.

## Research / prototype (`/app/research`)

Only **selected** ideas. Empty until something is adopted. Workers AI is copy-only; no binding.

## Team (`/app/team`)

Do not invent teammates. Session placeholder (“ログイン中”) only. Disabled allowlist; crypto stub.

Data: `app/data/mock.ts` (empty arrays). Previews: [../ui-previews/](../ui-previews/).
