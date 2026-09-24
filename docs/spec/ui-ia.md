# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app/list`), **kanban view**, **new idea compose** (mobile home at `/app`; desktop modal), idea detail, **inspirations**, **analytics**, **settings** (team / access). Merge, research, and brainstorm exist as **per-idea actions** (deep links / detail rail), not primary destinations.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome is a **quiet light console**: Linear-leaning IA (plus-to-compose, keyboard-first, settings for access/team), LiteLLM-thin chrome (white main, hairline borders, shadow only on modal/popover), Ideation Cloud pastel stage pills. Do **not** copy Relic’s logo, Relic’s blue marketing LP, or X dark mode. Do not put 融合 / リサーチ in the sidebar. **インスピレーション** and **アナリティクス** are first-class destinations (sidebar + mobile tabs), not settings-adjacent.

| Token        | Value                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface      | `#FFFFFF`                                                                                                                                                                                                                       |
| Sidebar      | `#FAFAFB`                                                                                                                                                                                                                       |
| Table header | `#F4F5F7`                                                                                                                                                                                                                       |
| Border       | `#D4D8E0` (controls `#C8CED7`) — readable frames, softer than the post-#37 `#C5CAD3` / `#B8BFC9` treatment                                                                                                                      |
| Accent       | `#3B6EF6`                                                                                                                                                                                                                       |
| Body         | `#0A0A0A` near-black for headings, body, list titles, and nav labels (muted meta `#3A424E`)                                                                                                                                     |
| Row hover    | `#F8FAFE` / selection `#EEF2FD`                                                                                                                                                                                                 |
| Density      | Row ~40px desktop / slightly airier mobile cards; filter 46px, table header 36px; 1px dividers, not zebra. Rows stay filled: tags, stage, relative updated, aging, comment count, research mark.                                |
| Radius       | 6–7px controls, 9–12px panels                                                                                                                                                                                                   |
| Type         | Inter (400–600) + Noto Sans JP / Hiragino (400–600); IBM Plex Mono for meta only. Default UI `500`; titles, buttons, and primary nav `font-weight: 600`, near-black. Compose/detail **本文** uses primary text, not muted gray. |
| Brand        | Original SVG cloud + spark, wordmark 「アイデアクラウド」                                                                                                                                                                       |
| Pills        | Pastel chips for stage/tags only. Human/AI idea scores are compact 1–5 chips (`人4` `AI3`), not Relic S/A/B.                                                                                                                    |

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

| Viewport / UA                           | After login or `/app` | Primary nav                                                                                    |
| --------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| Mobile (`< md` **or** phone user-agent) | **New idea** `/app`   | Bottom tabs: 一覧 / インスピ / 分析. **+** in the header creates. Settings is a header gear.   |
| Desktop (`md` and up, not a phone UA)   | **List** `/app/list`  | Sidebar: brand, 新規アイデア, アイデア, インスピレーション, アナリティクス; 設定 at the bottom |

`/app` is compose-only (mobile home, スマホ=登録トップ). Cold open, refresh, and `/app` stay on compose — no extra tap. Phone UA stays compose-first even if the viewport is wide. Desktop client-replaces to `/app/list`. Day-to-day nav is list / inspirations / analytics; compose is a header **+** (and `⌘N` on desktop), not a tab. The mobile tab bar **hides** on compose so it feels like a stack (閉じる returns to 一覧). Mobile 一覧 is `/app/list` with 絞り込み collapsed (stage / tag / 熟成日数 / 並び順 live in that drawer; one calm tab row stays: すべて / 熟成中 / 熟成候補 / 試した).

Login has no app shell. Do not treat the gate as the product.

### Mobile tab bar

Three primary destinations. Create lives in the top-right **+**, not in the tab bar.

| Tab    | Path                | Short label | `aria-label`       | Notes                                   |
| ------ | ------------------- | ----------- | ------------------ | --------------------------------------- |
| List   | `/app/list`         | 一覧        | 一覧               | Desktop home; not highlighted on detail |
| Shelf  | `/app/inspirations` | インスピ    | インスピレーション | Gallery + OGP; header **+** adds a card |
| Counts | `/app/analytics`    | 分析        | アナリティクス     | D1 idea-row counts                      |

The tab bar stays on list / inspirations / analytics. It **hides** on stack screens (compose, idea detail, inspiration detail, settings, merge, research) so those screens can use a sticky title without stacked chrome. Settings is opened from the gear on list / inspirations / analytics headers. Compose is `/app` via the header **+**. Mobile headers and the tab spacer include `safe-area-inset` so content does not sit under the home indicator. Primary taps are ≥44px (`min-h-11`).

Helpers live in `app/nav.ts` (`isMobileNavActive`, `isWorkspaceNavActive`, `isMobileTabBarHidden`).

## Inspiration create (`/app/inspirations`)

Dump-and-go. A URL **or** a memo/title fragment is enough; the title is optional, and the URL field is focused when compose is open. The URL control is `type=text` with `inputmode=url` (not `type=url`) so mobile paste is not blocked by browser URL validation. `http://` and `https://` are both saved. Surrounding whitespace, newlines, and zero-width characters are stripped. A bare host or host/path is saved as `https://…`. If the title is empty and a URL is present, the card title becomes the fetched page title, otherwise a path slug, the hostname, or 「無題」. Open Graph failure does not block save. Error copy matches the failure: empty input, a malformed URL, or a non-http(s) scheme.

## Login (`/` and `/login`)

Minimal: brand mark + 「アイデアクラウド」, tagline 「思いつきを預け、寝かせ、熟した頃に見返す。」, one Google-looking **Google で続行** button, note 「組織アカウントのみ利用できます」. Continues to `/app` on mobile (compose) and `/app/list` on desktop. No allowlist essay or skip-login links.

## Idea list (`/app/list`, desktop home)

Always show list chrome (search, header **+** / 新規アイデア, tabs すべてのアイデア / 熟成中の棚, **ビュー**, stage/カテゴリ/tag/熟成日数 filter, **並び順**, テーブル / ボード), including when there are **0 ideas**. Empty illustration + **まだアイデアがありません**. Desktop table columns: idea (title wraps 2 lines + excerpt), stage, tags (or **自動タグなし**), comment count, research (**調査済** / **未実行**), compact human/AI score, relative **更新**, **作成**, aging days, row menu. Clickable headers sort by title / stage / updatedAt / createdAt (`sort` + `dir` in the URL; default 更新降順). Mobile cards wrap titles up to 3 lines, include ⋯ plus swipe for **次の段階** / **アーカイブ**, and still show tags + comment count + research + aging + scores. Board: each phase column keeps a fixed header; **only the cards scroll**. ⋯ menus portal + flip + max-height so they stay tappable on a narrow viewport. Row menu includes **削除** (confirm, hard delete). Mobile 絞り込み also has 並び順, tags, named views, and 熟成日数.

List view state is in the URL so Back/Forward and deep links work:

| Param      | Values                                                                  | Default (omitted) |
| ---------- | ----------------------------------------------------------------------- | ----------------- |
| `tab`      | `aging` (熟成中の棚), `candidates` (熟成候補), `tried` (試したアイデア) | all ideas         |
| `view`     | `board`                                                                 | `table`           |
| `stage`    | comma-separated stage ids                                               | none              |
| `tag`      | comma-separated tag labels                                              | none              |
| `category` | category id                                                             | none              |
| `q`        | search string                                                           | none              |
| `days`     | min aged days (`7`, `14`, `30`)                                         | none              |
| `sort`     | `updatedAt`, `createdAt`, `stage`, `title`                              | `updatedAt`       |
| `dir`      | `asc`, `desc`                                                           | `desc`            |
| `v`        | saved view id                                                           | none              |

Examples: `/app/list?tab=aging`, `/app/list?view=board&stage=ripe`, `/app/list?q=通勤`, `/app/list?v=3&stage=spark`. Tab / stage / view / tag / named-view changes push history; search typing uses `replace` so keystrokes do not stack. **ビューを保存** writes `saved_views` and sets `v`. Changing filters clears `v` unless the patch is applying a named view.

Row menu (⋯) lists **次の段階へ**, **リサーチを実行**, **ブレスト**, and **AI評価** immediately under 詳細 (not behind 段階), plus **コピー**, **アーカイブ**, and **削除** (browser confirm; hard-deletes the row and its comments/brainstorms). **コピー** puts title, body, stage, category when set, and tags on the clipboard (**コピーしました** / **コピーできませんでした**). A set **カテゴリ** shows on the row (and under the desktop title) separately from tag chips. Mobile list rows are title-first: stage + aging + relative time on a quiet meta line; swipe and ⋯ stay for secondary actions (no extra chrome). List swipe is 88px **次の段階へ** / **アーカイブ** (`IdeaSwipeRow`, hidden from `md`). Detail is tabbed: **概要 | リサーチ | AI/履歴 | 相談 | コメント** (`#research` / `#history` / `#brainstorm` / `#evaluate` / `#discuss` / `#comments`). The fragment is not sent to the server, so the first paint is **概要** and the hashed tab applies immediately after. 概要 keeps wrapping title + body, tags, one primary **次の段階へ**, compact 見直し. リサーチ shows run controls + **先行事例** links (or **Web検索未取得**) above **AIコメント**. AI/履歴 is `buildIdeaHistory` and repeats the latest research snapshot. Secondary actions are a left swipe on the body (`IdeaDetailSwipe`, 72px targets, hidden from `lg`): **編集** / **AI** / **融合** / **アーカイブ**. Mobile also keeps a 44px **編集** in the sticky header (not a ⋯ menu). **AI** opens a large-target panel with compact リサーチ / ブレスト / AI評価 (not a tiny popover). Desktop keeps visible **編集** + the rail (including **コピー** and **削除**). Mobile detail shows **コピー** under the tabs. Archive-only lock: **アーカイブではリサーチできません** / **アーカイブではブレストできません** / **アーカイブではAI評価できません** / **アーカイブでは相談できません**. The AI swipe panel and desktop rail also link **AIと話す** (`#discuss`). List ⋯ includes the same link. Presets **速い・安い** / **標準** / **じっくり**, loading **実行中…**, a Japanese error if AI fails.

### Idea detail 履歴

One chronological **履歴** section (detail tab **AI/履歴**, hashes `#history` / `#brainstorm` / `#evaluate`; `#research` opens the リサーチ tab) lists stored AI/research output, newest first, expandable:

| Kind     | Source                                                                | Persistence                                                                                                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リサーチ | `ideas.research_notes` + model + `researched_at` + `research_sources` | **Latest only** (overwrite). Marked 最新. **先行事例** links (or **Web検索未取得**) sit above **AIコメント**.                                                                                                                                                                           |
| AI評価   | `ideas.ai_evaluation` + score + model + `ai_evaluated_at`             | **Latest only** (overwrite). Marked 最新. Primary view is **推し度** (1–5 and a one-line meaning) plus cards for 強み / リスク / 新規性 / 次の一手. Axis decimals and raw model ids stay off that view; a short preset or Jev label is secondary. Unparsed notes fall back to pre-wrap. |
| ブレスト | `idea_brainstorms` rows                                               | **Every run** (append). Fallback to the idea snapshot if no rows are passed.                                                                                                                                                                                                            |

Do not invent a separate history table for research or evaluation. Gaps: research and evaluation have no run log — only the current snapshot on the idea row. Helper: `app/lib/idea-history.ts` (`buildIdeaHistory`).

### Idea detail 相談

Tab **相談** (`#discuss`), title **AIと話す**. Chronological chat (you / AI) stored in `idea_chat_messages`. Composer plus starter chips (**LPにするなら**, **法的リスクは？**, **次の一手は？**, **競合との差別化**) that send immediately. Pending copy is **送信中…** / **考えています…**. A short line says this is not legal judgment. Archive hides the composer. Workers AI only (not Jev). No MCP tool.

Detail also has **編集** (title/body/tags/stage/カテゴリ) and a **コメント** stream (oldest first, composer at the bottom). Successful comment create clears the composer. `intent=comment` inserts into `idea_comments`. Mock author is the session placeholder unless the API has an Access email. Mobile 振り返り is progressive disclosure; 見直し stays compact on the stack. Claude Design has mobile list + compose only; there is no dedicated mobile-detail frame. Until one exists, follow those screens’ tokens rather than inventing denser chrome.

| Stage      | Japanese   | Role            |
| ---------- | ---------- | --------------- |
| `spark`    | 着想       | Just caught     |
| `aging`    | 熟成中     | Resting         |
| `ripe`     | 熟した     | Review now      |
| `selected` | 採用       | Ready to act on |
| `archived` | アーカイブ | Off the board   |

Route: `app/routes/app/board.tsx` (loader reads D1 `ideas` + `saved_views`). Detail: `/app/ideas/:ideaId` (loader reads the saved row, all `idea_brainstorms` for 履歴, and `idea_chat_messages` for 相談).

## New idea (`/app`, `/app/capture`, desktop modal)

Not a desktop nav tab. Desktop: 新規アイデア in the sidebar and a header **+** (and `⌘N` / `Ctrl+N`) opens a compose modal; `⌘Enter` / `Ctrl+Enter` submits. Mobile: compose-first home at `/app` — 「閉じる」, title 「新規アイデア」, 「作成」 right, large title + body, stage chips, optional **カテゴリ** (seeded names plus **新しいカテゴリ…**), thin toolbar. Bottom nav is hidden on compose (stack). Day-to-day create is the header **+** on 一覧 (and the same **+** on the inspiration shelf).

`/app/capture` remains a deep-link alias (desktop: open modal on the list). Do not label the product 「キャプチャ」.

**作成** INSERTs into D1 (optional stage/tags/カテゴリ) and redirects to `/app/list`. Category is one optional bucket (`categories` + nullable `ideas.category_id`), not a tag. **なし** leaves it empty. **新しいカテゴリ…** saves a new name or reuses the same name. Detail **編集** can change or clear it. If the form/API omits tags, TypeSafe Jev (`jev-latest`) suggests 2–5 tags from a curated Japanese vocabulary when `TYPESAFE_API_KEY` is set; otherwise Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`) suggests short Japanese tags from title+body. Compose copy: **空なら自動タグ**. If AI fails, the idea is still created and list/detail show **自動タグなし** / **自動タグは付きませんでした**. If the body contains http(s) URLs, those are also upserted into the inspiration gallery (title from surrounding text or hostname, memo excerpt, max 5 distinct URLs, no page fetch at save time). Duplicate URLs are skipped. Shelf write failures do not block the idea save. Auto-imported cards use the domain-glyph fallback until **再取得** fills OGP. Auth is still mock; there is no per-user ownership.

## Merge / research (not primary nav)

`/app/merge` and `/app/research` are deep links from idea actions only. Do not advertise them in the sidebar or mobile bottom nav. Research and brainstorm run on idea detail via Workers AI: the **リサーチを実行** / **ブレスト** controls are real POSTs, not hash stubs. Research also fetches a few public web results for **先行事例** (fail-soft **Web検索未取得**) and shows them on the リサーチ tab. `/app/research?from=:id` redirects to detail `#research`. Empty `/app/research` when there is no `from` param. Empty merge when there is nothing to merge.

## Settings (`/app/settings`)

Team and access live here — not a top-level 「アクセス」 section. `/app/team` redirects to settings. Settings shell has a secondary nav (members / general / team / stages / profile / notify / shortcuts). **Do not invent teammates.** Session placeholder (“ログイン中”) only. Default-visibility cards are visual chrome, not persisted. On mobile, settings is a stack screen (gear from list / inspirations / analytics; tab bar hidden).

List/detail data: D1 `ideas` + `idea_comments` + `idea_brainstorms` + `idea_chat_messages` + `saved_views`. Stage labels and empty merge/settings shells still use `app/data/mock.ts` (no seed rows). Research notes load from the idea row (latest only); brainstorms load every `idea_brainstorms` row into detail **履歴**. **熟成候補** / **試したアイデア** are extra list tabs (URL `tab`). List sort is URL `sort`/`dir`. Detail has **見直し** and **振り返り**, plus a hard **削除** with confirm. `/app/analytics` is a **top-level** destination (sidebar + mobile 分析 tab) summarizing D1 idea-row counts, including created-per-day for the last 7/30 days and counts by stage. `/app/inspirations` is the inspiration **gallery** (card grid / masonry-like; 2-col on mobile) and a **top-level** destination (sidebar + mobile インスピ tab; header **+** opens compose). Cards prefer the cached `og:image`; fallback is a domain glyph + title + memo snippet. Detail repeats the rich preview and offers **再取得**. Previews: [../ui-previews/](../ui-previews/).
