# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app/list`), **kanban view**, **new idea compose** (mobile home at `/app`; desktop modal), idea detail, **settings** (team / access). Merge, research, and brainstorm exist as **per-idea actions** (deep links / detail rail), not primary destinations.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome is a **quiet light console**: Linear-leaning IA (plus-to-compose, keyboard-first, settings for access/team), LiteLLM-thin chrome (white main, hairline borders, shadow only on modal/popover), Ideation Cloud pastel stage pills. Do **not** copy Relic’s logo, Relic’s blue marketing LP, or X dark mode. Do not put 融合 / リサーチ in the sidebar.

| Token        | Value                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface      | `#FFFFFF`                                                                                                                                                             |
| Sidebar      | `#FAFAFB`                                                                                                                                                             |
| Table header | `#FCFCFD`                                                                                                                                                             |
| Border       | `#E9EBEF` (controls `#E3E6EC`)                                                                                                                                        |
| Accent       | `#3B6EF6`                                                                                                                                                             |
| Body         | `#15181D`                                                                                                                                                             |
| Row hover    | `#F8FAFE` / selection `#EEF2FD`                                                                                                                                       |
| Density      | Row ~40px, filter 46px, table header 36px; 1px dividers, not zebra. Rows stay compact but filled: tags, stage, relative updated, aging, comment count, research mark. |
| Radius       | 6–7px controls, 9–12px panels                                                                                                                                         |
| Type         | Inter (400–600) + Noto Sans JP / Hiragino (400–500); IBM Plex Mono for meta only. Titles `font-weight: 500` with slightly tight tracking.                             |
| Brand        | Original SVG cloud + spark, wordmark 「アイデアクラウド」                                                                                                             |
| Pills        | Pastel chips for stage/tags only. Human/AI idea scores are compact 1–5 chips (`人4` `AI3`), not Relic S/A/B.                                                          |

Stage pill hex (background / foreground):

| Stage      | Japanese   | Background | Foreground |
| ---------- | ---------- | ---------- | ---------- |
| `spark`    | 着想       | `#F3F0FF`  | `#6D28D9`  |
| `aging`    | 熟成中     | `#FFF6EC`  | `#B45309`  |
| `ripe`     | 熟した     | `#ECFBF6`  | `#0F766E`  |
| `selected` | 採用       | `#EDF4FF`  | `#1F49C4`  |
| `archived` | アーカイブ | `#F4F5F8`  | `#687280`  |

Empty workspace still shows **view chrome** (sidebar, list header, filters, table/board toggle). Centered empty copy is **まだアイデアがありません** (board columns still use **まだありません**).

## Brand

Sidebar header, mobile list header, and login gate use the same mark + wordmark. Geometry is a flat cloud with a spark — not Relic’s mark and not an X bird. The browser tab icon (`/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`) is that mark as a high-contrast white silhouette on the brand blue tile so it stays readable at 16×16.

## Responsive homes

| Viewport               | After entering `/app` | Primary nav                                  |
| ---------------------- | --------------------- | -------------------------------------------- |
| Mobile (`< md`, 768px) | **New idea** `/app`   | Bottom nav: 一覧 + 新規 + 設定               |
| Desktop (`md` and up)  | **List** `/app/list`  | Sidebar: brand, 新規アイデア, アイデア, 設定 |

`/app` is compose-only (mobile home). Desktop client-replaces to `/app/list`. Mobile 一覧 is `/app/list` with 絞り込み collapsed.

Login has no app shell. Do not treat the gate as the product.

## Login (`/` and `/login`)

Minimal: brand mark + 「アイデアクラウド」, tagline 「思いつきを預け、寝かせ、熟した頃に見返す。」, one Google-looking **Google で続行** button, note 「組織アカウントのみ利用できます」. Continues to `/app`. No allowlist essay or skip-login links.

## Idea list (`/app/list`, desktop home)

Always show list chrome (search, 新規アイデア, tabs すべてのアイデア / 熟成中の棚, **ビュー**, stage/tag/熟成日数 filter, テーブル / ボード), including when there are **0 ideas**. Empty illustration + **まだアイデアがありません**. Desktop table columns: idea (title wraps 2 lines + excerpt), stage, tags (or **自動タグなし**), comment count, research (**調査済** / **未実行**), compact human/AI score, relative **更新**, aging days, row menu. Mobile cards wrap titles up to 3 lines, include ⋯ plus swipe for **次の段階** / **アーカイブ**, and still show tags + comment count + research + aging + scores. Board cards show the same signals. Mobile 絞り込み also has tags, named views, and 熟成日数.

List view state is in the URL so Back/Forward and deep links work:

| Param   | Values                          | Default (omitted) |
| ------- | ------------------------------- | ----------------- |
| `tab`   | `aging` (熟成中の棚)            | all ideas         |
| `view`  | `board`                         | `table`           |
| `stage` | comma-separated stage ids       | none              |
| `tag`   | comma-separated tag labels      | none              |
| `q`     | search string                   | none              |
| `days`  | min aged days (`7`, `14`, `30`) | none              |
| `v`     | saved view id                   | none              |

Examples: `/app/list?tab=aging`, `/app/list?view=board&stage=ripe`, `/app/list?q=通勤`, `/app/list?v=3&stage=spark`. Tab / stage / view / tag / named-view changes push history; search typing uses `replace` so keystrokes do not stack. **ビューを保存** writes `saved_views` and sets `v`. Changing filters clears `v` unless the patch is applying a named view.

Row menu (⋯) lists **次の段階へ**, **リサーチを実行**, **ブレスト**, and **AI評価** immediately under 詳細 (not behind 段階), plus **アーカイブ**. Detail rail puts those controls first; mobile detail uses a single **AI** disclosure instead of stacking every panel. Archive-only lock: **アーカイブではリサーチできません** / **アーカイブではブレストできません** / **アーカイブではAI評価できません**. Presets **速い・安い** / **標準** / **じっくり**, loading **実行中…**, a Japanese error if AI fails. Research notes stay on the idea row; brainstorm latest row is on detail (`#brainstorm`).

Detail also has **編集** (title/body/tags/stage) and a **コメント** stream (oldest first, composer at the bottom). Successful comment create clears the composer. `intent=comment` inserts into `idea_comments`. Mock author is the session placeholder unless the API has an Access email. Mobile detail is a quiet stack (back, stage + aging, wrapping title + body, tags, one action row, compact human score, comments) — not a shrunk desktop rail.

| Stage      | Japanese   | Role            |
| ---------- | ---------- | --------------- |
| `spark`    | 着想       | Just caught     |
| `aging`    | 熟成中     | Resting         |
| `ripe`     | 熟した     | Review now      |
| `selected` | 採用       | Ready to act on |
| `archived` | アーカイブ | Off the board   |

Route: `app/routes/app/board.tsx` (loader reads D1 `ideas` + `saved_views`). Detail: `/app/ideas/:ideaId` (loader reads the saved row + latest brainstorm).

## New idea (`/app`, `/app/capture`, desktop modal)

Not a desktop nav tab. Desktop: 新規アイデア in the sidebar (and `⌘N` / `Ctrl+N`) opens a compose modal; `⌘Enter` / `Ctrl+Enter` submits. Mobile: compose-first home at `/app` — 「閉じる」, title 「新規アイデア」, 「作成」 right, large title + body, stage chips, thin toolbar. Bottom nav stays visible.

`/app/capture` remains a deep-link alias (desktop: open modal on the list). Do not label the product 「キャプチャ」.

**作成** INSERTs into D1 (optional stage/tags) and redirects to `/app/list`. If the form/API omits tags, Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`) suggests a few short Japanese tags from title+body and they are stored on the row. Compose copy: **空なら自動タグ**. If AI fails, the idea is still created and list/detail show **自動タグなし** / **自動タグは付きませんでした**. Auth is still mock; there is no per-user ownership.

## Merge / research (not primary nav)

`/app/merge` and `/app/research` are deep links from idea actions only. Do not advertise them in the sidebar or mobile bottom nav. Research and brainstorm run on idea detail via Workers AI (no web search): the **リサーチを実行** / **ブレスト** controls are real POSTs, not hash stubs. `/app/research?from=:id` redirects to detail `#research`. Empty `/app/research` when there is no `from` param. Empty merge when there is nothing to merge.

## Settings (`/app/settings`)

Team and access live here — not a top-level 「アクセス」 section. `/app/team` redirects to settings. Settings shell has a secondary nav (members / general / team / stages / profile / notify / shortcuts). **Do not invent teammates.** Session placeholder (“ログイン中”) only. Default-visibility cards are visual chrome, not persisted.

List/detail data: D1 `ideas` + `idea_comments` + `idea_brainstorms` + `saved_views`. Stage labels and empty merge/settings shells still use `app/data/mock.ts` (no seed rows). Research notes load from the idea row; brainstorm from the latest `idea_brainstorms` row. Previews: [../ui-previews/](../ui-previews/).
