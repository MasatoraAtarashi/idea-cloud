# Product requirements

Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学): ideas get better when they are captured quickly, left alone, and reviewed only after time has passed.

**Audience:** Masatora Atarashi and a small closed team (Atarashi Lab). Solo-usable, team-default.

**Language:** Japanese product UI. English engineering docs (`docs/spec/`, README).

## Problem

Most note apps optimize for capture _and_ immediate polishing. That kills the forgetting period the book treats as the real work. Idea Cloud is a shelf for time, not a progress tracker.

## Goals (this first pass)

1. Public surface is a quiet Japanese **login gate** only (`/` and `/login`). No landing page.
2. Clickable UI shell plus **minimal D1 idea persistence** so create/list/detail use real rows. Empty list still shows view chrome; empty copy is **まだアイデアがありません**. **作成** may auto-tag via TypeSafe Jev when `TYPESAFE_API_KEY` is set, otherwise Workers AI (fast 8B), when the user did not supply tags; empty tags show **自動タグなし** rather than a blank cell. Each idea has a Zenn-scrap-style **コメント** stream. Non-archive ideas can run **リサーチ**, **ブレスト**, and **AI評価** from the detail rail, a collapsed mobile **AI** menu, and the list ⋯ menu (text only; no web search). AI評価 prefers Jev scores when the TypeSafe key is present. Named list **ビュー** persist stage/tag/search/aged-days filters. List rows show tags, stage, relative updated, aging, comment count, research, and compact human/AI scores. Detail has **編集** for title/body/tags/stage.
3. Visual direction: quiet light console — Linear IA × LiteLLM-thin chrome × Ideation Cloud pastel stages (see [ui-ia.md](./ui-ia.md)). Not Relic’s logo or blue marketing LP.
4. Security stubs that match the intended posture: in-app Google OAuth later, allowlist, AES-GCM helper (see [security.md](./security.md)). Login is a Google-looking mock into `/app` on mobile (compose-first) and `/app/list` on desktop. Auth is still mock — no Google OAuth / allowlist / Access work this pass.
5. Keep the template CI (typecheck, lint, test, gitleaks, zizmor, audit, ASH).

## Idea stages

| Id         | Japanese label | Meaning                                                                 |
| ---------- | -------------- | ----------------------------------------------------------------------- |
| `spark`    | 着想           | Just captured. Do not polish.                                           |
| `aging`    | 熟成中         | Resting. Forgetting is allowed.                                         |
| `ripe`     | 熟した         | Time to review: advance, merge, or discard.                             |
| `selected` | 採用           | Ready to act on; research and brainstorm are already available earlier. |
| `archived` | アーカイブ     | Kept as a record, off the board.                                        |

Rules that the UI must teach:

- Mobile (viewport `< md` or a phone user-agent) is for composing a new idea — login / `/app` / refresh open compose directly. Desktop is for judgment (list-first).
- Research, brainstorm, and AI evaluation may run from **着想** onward. **アーカイブ** stays blocked.
- Discarding is a first-class ritual, not a silent delete.
- List ⋯ includes **次の段階へ** (着想→熟成中→熟した→採用) and **アーカイブ**. Mobile rows also swipe to those two actions.
- Titles wrap (2–3 lines on the list, full wrap on detail). Primary controls use ~44px mobile tap targets and show pending UI on the click tick (do not wait for Workers AI).

## Screens in scope

See [ui-ia.md](./ui-ia.md). Paths: `/app` (mobile new-idea home, including phone UA; desktop → `/app/list`), `/app/capture` (compose alias), `/app/list` (desktop list home / mobile 一覧; URL filters + named views + `days` aged filter), `/app/ideas/:id` (detail + edit + リサーチ / ブレスト / AI評価 / human score), `/app/merge` and `/app/research` (deep links; research `from` redirects to detail), `/app/settings` (team / access; `/app/team` redirects).

## Auto-tags (create)

On **作成** (form action and `POST /api/ideas`), if tags are empty, prefer TypeSafe Jev (`jev-latest`) when `TYPESAFE_API_KEY` is set: one `choice` over a curated Japanese tag/category vocabulary, then take 2–5 labels from the probability distribution. If the key is missing or Jev fails, call Workers AI with the same fast model as research 「速い・安い」 (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`). Persist short Japanese tags. Fail soft: missing binding, model error, or empty parse → create with `[]` (or keep user-provided tags). The compose field says **空なら自動タグ**; list/detail show **自動タグなし** / **自動タグは付きませんでした** when the array is empty so the feature is visible even on failure. Tests stub `setTestSystemOneRun` / `setTestTagAiRun`; CI does not call live TypeSafe or Workers AI.

## Comments (Zenn scrap style)

Per-idea chronological notes. Composer + list on detail (`#comments`); optional count on the list. Persist in D1 `idea_comments`. Mock auth stores `SESSION_USER` (`mock-user` / ログイン中) on the UI action; `POST /api/ideas/:id/comments` uses the Access email when present, else that same display name. No reactions or threads in v1. Adding a comment bumps `ideas.updated_at`.

## Research (v1)

Per-idea only. **リサーチを実行** (detail rail, mobile AI sheet, list row menu) POSTs the idea action via `useFetcher` (no full-document wait on Workers AI). Available from **着想** / **熟成中** / **熟した** / **採用**. **アーカイブ** stays locked (**アーカイブではリサーチできません**). Presets **速い・安い** / **標準** / **じっくり**. Last notes + model + timestamp persist on the idea. AI failure returns a Japanese error and does not wipe existing notes. No web search in this version. Tests stub `setTestAiRun`. List shows **調査済** or **未実行**.

## Brainstorm / expand (v1)

Per-idea **ブレスト** next to research. Workers AI reads title + body + recent comments and returns 切り口 / 別案 / 次の問い / 関連する方向. Default preset is **標準**; fast/deep optional. Rows persist in D1 `idea_brainstorms` (queryable on detail; UI shows the latest). Archive is blocked. Fail-soft Japanese error. Tests stub the same AI runner.

## Evaluation (v1)

Per-idea **human 1–5** (`human_score`, optional note, timestamp) plus **AI評価**. When `TYPESAFE_API_KEY` is set, Jev scores novelty / impact / feasibility / clarity / risk, a pursue `noul`, and a next-action `choice`; code maps the composite onto 1–5 and Japanese 強み / リスク / 新規性 / 次の一手 notes. Otherwise Workers AI (default **標準**) writes the same headings plus `スコア: N`. Persist `ai_score`, `ai_evaluation`, `ai_evaluated_at`, `ai_evaluation_model` (`jev-latest` or a Workers AI id). Archive blocked. Compact `人N` / `AIN` chips on the list. Not Relic multi-axis / S/A/B scoring.

## Saved list views (v1)

Named filters on `/app/list`: at least stage + tag/category, plus current search/tab/layout and aged-days (`days=7|14|30`). Stored in D1 `saved_views` (`name` + filter JSON). Chrome: **ビュー** menu to switch, save, or delete. URL keeps `tab` / `view` / `stage` / `tag` / `q` / `days` and adds `v` (saved view id) so Back/Forward works. Not a full Linear view builder.

## Review candidates (v1 skeleton)

List tab **熟成候補** (`tab=candidates`). Ideas whose `created_at` or `last_reviewed_at` is older than a threshold (URL `days`, default 7), excluding **アーカイブ**. List/detail show a light **見直し** prompt: **見直した** / **保留** / **次の段階へ**. Persist `last_reviewed_at` + `review_status` (`none` / `hold` / `reviewed`).

## Tried-idea reflection (v1 skeleton)

Optional reflection on an idea: `reflection_outcome` (やってみた結果), `reflection_status` (`none` / `tried` / `hold` / `dropped`), `reflection_notes`. Detail can edit/save. List shows a small badge when present. Tab **試したアイデア** (`tab=tried`) is stage **採用** or any reflection. Reflections are **not** sent to Jev / Workers AI yet; they are intended later as knowledge for evaluation and brainstorm.

## Analytics (v1 skeleton)

`/app/analytics` counts from current D1 idea rows (no extra analytics table): stage totals, average/median aged days, human/AI score counts, reflection count, top tags. Numbers + compact bars only.

## Inspiration shelf (gallery + OGP)

D1 `inspirations` (`title`, nullable `url`, `memo`, optional tags, plus cached Open Graph fields). `/app/inspirations` is a **mood-board gallery** (2-col mobile, masonry-like on desktop), not a table. Cards show `og:image` when present, otherwise a domain-glyph fallback. Detail shows the same preview prominently and can **再取得**. Saving a URL from the gallery or API fetches `og:title` / `og:description` / `og:image` / `og:site_name` (twitter:image fallback) with timeout, size cap, and SSRF blocks; fetch failure stores `og_status=failed` and does **not** fail the save. Images are hotlinked (`<img loading=lazy referrerpolicy=no-referrer>`); no R2 upload. **AIブレスト** still creates an idea; seed text may include `og_title`. Creating or editing an idea whose body contains http(s) URLs also upserts those URLs here (max 5, hostname/context title, fail-soft, no page fetch at save time). Auto-imported rows use the gallery glyph fallback until **再取得** or a later URL save fills OGP.

## Out of scope (this pass)

- In-app Google OAuth / sessions / allowlist / Access (login stays a mock continue into `/app`)
- Merge / team features beyond empty shells
- Research web search, Browser Rendering, embeddings, merge AI
- Per-user ownership (single shared workspace)
- Field encryption on idea rows
- Relation extraction, evolution suggestions
- Image/file attachments (R2)
- Native apps
- Public multi-tenant signup
- Dark mode (LiteLLM default is light; dark is a later experiment)

## Success for this pass

A reviewer signs in via the mock Google button, creates an idea with **作成**, and sees it on `/app/list` after reload (auto-tags present when Jev or Workers AI succeeds; **自動タグなし** when it fails). They can add comments over time on detail; the composer clears after a successful submit. List tabs/filters/named views/aged-days are URL-backed. Empty DB still shows list chrome with **まだアイデアがありません**. Auth stays mocked. From **着想**, detail **リサーチ** / **ブレスト** / **AI評価** persist notes across reload (Jev for evaluation when keyed; Workers AI otherwise; tests stub the model). Clicks show pending UI immediately.
