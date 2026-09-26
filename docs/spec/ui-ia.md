# UI information architecture

Product UI copy is **Japanese**. This spec is English.

Working screens: **login gate**, **idea list** (desktop home at `/app/list`), **kanban view**, **new idea compose** (mobile home at `/app`; desktop modal), idea detail, **inspirations**, **analytics**, **settings** (team / access). Merge, research, and brainstorm exist as **per-idea actions** (deep links / detail rail), not primary destinations.

There is **no landing page**. `/` is the login gate.

## Visual language

Chrome is a **quiet light console**: Linear-leaning IA (plus-to-compose, keyboard-first, settings for access/team), LiteLLM-thin chrome (white main, hairline borders, shadow only on modal/popover), Ideation Cloud pastel stage pills. Do **not** copy Relic’s logo, Relic’s blue marketing LP, or X dark mode. Do not put 融合 / リサーチ in the sidebar. **インスピレーション** and **アナリティクス** are first-class destinations (sidebar + mobile tabs), not settings-adjacent.

The v2 redesign (Claude Design handoff, 2026-09) moved chrome to cool grey with thin rows. Values live in `app/app.css` and `app/lib/tokens.ts`.

| Token   | Value                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------- |
| App bg  | `#F9FAFB`; surfaces (cards, header, sidebar) `#FFFFFF`; sunken (AI 作業台, footers) `#F9FAFB`           |
| Border  | weak `#EAECF0`, card `#E4E7EC`, control `#D0D5DD`                                                       |
| Text    | primary `#101828`, secondary `#344054`, tertiary `#475467`, muted `#667085` (lightest text tone)        |
| Grey    | `#98A2B3` / `#D0D5DD` for dots, rules, bars only — never text                                           |
| Primary | button bg `#101828`, white text                                                                         |
| Accent  | `#4F46E5` (`--accent`) for AI-origin things only: AI send, logo, 推し度                                 |
| Type    | IBM Plex Sans JP 400–700; IBM Plex Mono for numbers, time, ids, labels                                  |
| Radius  | buttons / inputs 7–8px, cards 10px, frames 12px, pills 999px, tags 5px                                  |
| Shadow  | none on cards; modal `0 16px 40px rgba(16,24,40,0.18)`; hover row/card `0 4px 12px rgba(16,24,40,0.10)` |
| Tags    | square-ish 5px chips, 8 colors from a hash of the name (same tag = same color everywhere)               |
| Brand   | 24px accent square + wordmark 「Idea Cloud」 in the sidebar                                             |

Stage pills are round with a leading dot (background / text / dot):

| Stage      | Japanese   | Background | Text      | Dot       |
| ---------- | ---------- | ---------- | --------- | --------- |
| `spark`    | 着想       | `#F2F4F7`  | `#344054` | `#98A2B3` |
| `aging`    | 熟成中     | `#FFFAEB`  | `#B54708` | `#F79009` |
| `ripe`     | 熟した     | `#ECFDF3`  | `#067647` | `#17B26A` |
| `selected` | 採用       | `#EEF4FF`  | `#3538CD` | `#6172F3` |
| `archived` | アーカイブ | `#F9FAFB`  | `#667085` | `#D0D5DD` |

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
| `peek`     | idea id open in the quick-look drawer                                   | none              |

Examples: `/app/list?tab=aging`, `/app/list?view=board&stage=ripe`, `/app/list?q=通勤`, `/app/list?v=3&stage=spark`. Tab / stage / view / tag / named-view changes push history; search typing uses `replace` so keystrokes do not stack. **ビューを保存** writes `saved_views` and sets `v`. Changing filters clears `v` unless the patch is applying a named view.

The desktop list is one table grouped by stage (熟成中 → 熟した → 着想 → 採用 → アーカイブ). Sorting and filtering live in the sticky column header: click 段階 / アイデア / 熟成 / 更新 to sort (again to flip), and ▾ on 段階 / アイデア (keyword + カテゴリ) / タグ / 熟成 to filter that column. 「条件をクリア」 appears on the tab row while filters are active. Rows are one 40px line (pill, title + excerpt, up to 3 tags, 推し度, comments, aging, updated, ⋯). Row menu (⋯) is **次の段階へ** / **コピー** / **アーカイブ** / **削除** only — no AI items. Mobile keeps cards, a 絞り込み drawer, and swipe (left 次の段階へ, right アーカイブ).

### Quick peek drawer

Clicking a row opens a drawer instead of leaving the list, so a shelf can be skimmed: stage, aged days, updated, comments, title, body, tags and the 推し度 card. Evaluated ideas show their score and the four sections; unevaluated ones show **AI評価する** in place of them, and archived ones say why they cannot run. Everything else — リサーチ / ブレスト / 相談 — stays on the detail page, one **詳細を開く** away.

The open idea is `?peek=<id>`, so a reload keeps it open, the link can be sent, and Back (or the phone's back gesture) closes it. `shouldRevalidate` in `app/routes/app/board.tsx` skips the loader when only `peek` changed: the drawer renders from the list payload, which already carries `aiScore` and `aiEvaluation`, so flipping costs no query.

↑/↓ (or j/k) and the header arrows move to the neighbouring idea, in the order the list is **displayed** — grouped by stage, not the raw sort — and `replace` history, so Back leaves the list rather than walking every stop. A burst of keypresses resolves against the pending target, not the URL, so three taps move three ideas. Escape, the backdrop and ✕ close it and hand focus back to the row.

Rows stay `<a href="/app/ideas/:id">`; the drawer is a plain-left-click interception. ⌘/Ctrl/middle-click still opens the detail page, and anything reading the list by its links keeps working. Right-hand drawer on `sm` and up, bottom sheet below. The evaluate form is aimed at `/app/ideas/:id` — an action-less post from the list would reach the board's action, which knows no `evaluate` intent.

Detail (desktop) is the thinking column (title, body, tags, 見直し band with 見直した / 保留 / 捨てる, コメント, collapsible 自分の評価と振り返り) plus the **AI 作業台** on the right. The 作業台 has a preset (**速い・安い** / **標準** / **じっくり**) used by every run, an always-on 推し度 card, and tabs **相談 | 評価 | リサーチ | ブレスト** (`#discuss` / `#evaluate` / `#research` / `#brainstorm`). Each tab shows its own past output; there is no separate 履歴 tab (old `#history` / `#ai` links open 評価). Mobile detail switches アイデア | AI 作業台 with a segment. Archive locks all AI (**アーカイブでは相談できません** etc.) and 次の段階へ.

Persistence per tab: リサーチ and AI評価 keep the **latest only** on the idea row; ブレスト appends every run in `idea_brainstorms`; 相談 is chronological in `idea_chat_messages`. Do not invent a separate history table for research or evaluation.

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
