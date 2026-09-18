# Product requirements

Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学): ideas get better when they are captured quickly, left alone, and reviewed only after time has passed.

**Audience:** Masatora Atarashi and a small closed team (Atarashi Lab). Solo-usable, team-default.

**Language:** Japanese product UI. English engineering docs (`docs/spec/`, README).

## Problem

Most note apps optimize for capture _and_ immediate polishing. That kills the forgetting period the book treats as the real work. Idea Cloud is a shelf for time, not a progress tracker.

## Goals (this first pass)

1. Public surface is a quiet Japanese **login gate** only (`/` and `/login`). No landing page.
2. Clickable UI shell plus **minimal D1 idea persistence** so create/list/detail use real rows. Empty list still shows view chrome; empty copy is **まだアイデアがありません**. **作成** may auto-tag via Workers AI (fast 8B) when the user did not supply tags; empty tags show **自動タグなし** rather than a blank cell. Each idea has a Zenn-scrap-style **コメント** stream. Non-archive ideas can run Workers AI **リサーチ**, **ブレスト**, and **AI評価** from the detail rail, a collapsed mobile **AI** menu, and the list ⋯ menu (text only; no web search). Named list **ビュー** persist stage/tag/search/aged-days filters. List rows show tags, stage, relative updated, aging, comment count, research, and compact human/AI scores. Detail has **編集** for title/body/tags/stage.
3. Visual direction: quiet light console — Linear IA × LiteLLM-thin chrome × Ideation Cloud pastel stages (see [ui-ia.md](./ui-ia.md)). Not Relic’s logo or blue marketing LP.
4. Security stubs that match the intended posture: in-app Google OAuth later, allowlist, AES-GCM helper (see [security.md](./security.md)). Login is a Google-looking mock into `/app`. Auth is still mock — no Google OAuth / allowlist / Access work this pass.
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

- Mobile is for composing a new idea. Desktop is for judgment.
- Research, brainstorm, and AI evaluation may run from **着想** onward. **アーカイブ** stays blocked.
- Discarding is a first-class ritual, not a silent delete.
- List ⋯ includes **次の段階へ** (着想→熟成中→熟した→採用) and **アーカイブ**. Mobile rows also swipe to those two actions.
- Titles wrap (2–3 lines on the list, full wrap on detail). Primary controls use ~44px mobile tap targets and show pending UI on the click tick (do not wait for Workers AI).

## Screens in scope

See [ui-ia.md](./ui-ia.md). Paths: `/app` (mobile new-idea home; desktop → `/app/list`), `/app/capture` (compose alias), `/app/list` (desktop list home / mobile 一覧; URL filters + named views + `days` aged filter), `/app/ideas/:id` (detail + edit + リサーチ / ブレスト / AI評価 / human score), `/app/merge` and `/app/research` (deep links; research `from` redirects to detail), `/app/settings` (team / access; `/app/team` redirects).

## Auto-tags (create)

On **作成** (form action and `POST /api/ideas`), if tags are empty, call Workers AI with the same fast model as research 「速い・安い」 (`@cf/meta/llama-3.1-8b-instruct-fp8-fast`). Persist 2–5 short Japanese tags. Fail soft: missing binding, model error, or empty parse → create with `[]` (or keep user-provided tags). The compose field says **空なら自動タグ**; list/detail show **自動タグなし** / **自動タグは付きませんでした** when the array is empty so the feature is visible even on failure. Tests stub `setTestTagAiRun`; CI does not call live Workers AI.

## Comments (Zenn scrap style)

Per-idea chronological notes. Composer + list on detail (`#comments`); optional count on the list. Persist in D1 `idea_comments`. Mock auth stores `SESSION_USER` (`mock-user` / ログイン中) on the UI action; `POST /api/ideas/:id/comments` uses the Access email when present, else that same display name. No reactions or threads in v1. Adding a comment bumps `ideas.updated_at`.

## Research (v1)

Per-idea only. **リサーチを実行** (detail rail, mobile AI sheet, list row menu) POSTs the idea action via `useFetcher` (no full-document wait on Workers AI). Available from **着想** / **熟成中** / **熟した** / **採用**. **アーカイブ** stays locked (**アーカイブではリサーチできません**). Presets **速い・安い** / **標準** / **じっくり**. Last notes + model + timestamp persist on the idea. AI failure returns a Japanese error and does not wipe existing notes. No web search in this version. Tests stub `setTestAiRun`. List shows **調査済** or **未実行**.

## Brainstorm / expand (v1)

Per-idea **ブレスト** next to research. Workers AI reads title + body + recent comments and returns 切り口 / 別案 / 次の問い / 関連する方向. Default preset is **標準**; fast/deep optional. Rows persist in D1 `idea_brainstorms` (queryable on detail; UI shows the latest). Archive is blocked. Fail-soft Japanese error. Tests stub the same AI runner.

## Evaluation (v1)

Per-idea **human 1–5** (`human_score`, optional note, timestamp) plus **AI評価** (Workers AI, default **標準**). AI writes Japanese 強み / リスク / 新規性 / 次の一手 and `スコア: N`. Persist `ai_score`, `ai_evaluation`, `ai_evaluated_at`, `ai_evaluation_model`. Archive blocked. Compact `人N` / `AIN` chips on the list. Not Relic multi-axis / S/A/B scoring.

## Saved list views (v1)

Named filters on `/app/list`: at least stage + tag/category, plus current search/tab/layout and aged-days (`days=7|14|30`). Stored in D1 `saved_views` (`name` + filter JSON). Chrome: **ビュー** menu to switch, save, or delete. URL keeps `tab` / `view` / `stage` / `tag` / `q` / `days` and adds `v` (saved view id) so Back/Forward works. Not a full Linear view builder.

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

A reviewer signs in via the mock Google button, creates an idea with **作成**, and sees it on `/app/list` after reload (auto-tags present when AI succeeds; **自動タグなし** when it fails). They can add comments over time on detail; the composer clears after a successful submit. List tabs/filters/named views/aged-days are URL-backed. Empty DB still shows list chrome with **まだアイデアがありません**. Auth stays mocked. From **着想**, detail **リサーチ** / **ブレスト** / **AI評価** persist notes across reload (Workers AI; tests stub the model). Clicks show pending UI immediately.
