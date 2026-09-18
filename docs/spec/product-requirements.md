# Product requirements

Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学): ideas get better when they are captured quickly, left alone, and reviewed only after time has passed.

**Audience:** Masatora Atarashi and a small closed team (Atarashi Lab). Solo-usable, team-default.

**Language:** Japanese product UI. English engineering docs (`docs/spec/`, README).

## Problem

Most note apps optimize for capture _and_ immediate polishing. That kills the forgetting period the book treats as the real work. Idea Cloud is a shelf for time, not a progress tracker.

## Goals (this first pass)

1. Public surface is a quiet Japanese **login gate** only (`/` and `/login`). No landing page.
2. Clickable UI shell plus **minimal D1 idea persistence** so create/list/detail use real rows. Empty list still shows view chrome; empty copy is **まだアイデアがありません**. No dummy seed data. **採用** ideas can run Workers AI research from the detail page (text only; no web search). Detail includes a **段階** control so research can be unlocked without a SQL console.
3. Visual direction: quiet light console — Linear IA × LiteLLM-thin chrome × Ideation Cloud pastel stages (see [ui-ia.md](./ui-ia.md)). Not Relic’s logo or blue marketing LP.
4. Security stubs that match the intended posture: in-app Google OAuth later, allowlist, AES-GCM helper (see [security.md](./security.md)). Login is a Google-looking mock into `/app`. Auth is still mock — no Google OAuth / allowlist / Access work this pass.
5. Keep the template CI (typecheck, lint, test, gitleaks, zizmor, audit, ASH).

## Idea stages

| Id         | Japanese label | Meaning                                     |
| ---------- | -------------- | ------------------------------------------- |
| `spark`    | 着想           | Just captured. Do not polish.               |
| `aging`    | 熟成中         | Resting. Forgetting is allowed.             |
| `ripe`     | 熟した         | Time to review: advance, merge, or discard. |
| `selected` | 採用           | Only these get research / prototype work.   |
| `archived` | アーカイブ     | Kept as a record, off the board.            |

Rules that the UI must teach:

- Mobile is for composing a new idea. Desktop is for judgment.
- Do not research an idea until it is **selected**.
- Discarding is a first-class ritual, not a silent delete.

## Screens in scope

See [ui-ia.md](./ui-ia.md). Paths: `/app` (mobile new-idea home; desktop → `/app/list`), `/app/capture` (compose alias), `/app/list` (desktop list home / mobile 一覧), `/app/ideas/:id` (detail + per-idea リサーチ), `/app/merge` and `/app/research` (deep links; research `from` redirects to detail), `/app/settings` (team / access; `/app/team` redirects).

## Research (v0)

Per-idea only. Button **実行**, presets **速い・安い** / **標準** / **じっくり**. Last notes + model + timestamp persist on the idea. Reject unless stage is **採用**. No web search in this version.

## Out of scope (this pass)

- In-app Google OAuth / sessions / allowlist / Access (login stays a mock continue into `/app`)
- Merge / team features beyond empty shells
- Research web search, Browser Rendering, embeddings, merge AI
- Per-user ownership (single shared workspace)
- Field encryption on idea rows
- Workers AI tagging, relation extraction, evolution suggestions
- Native apps
- Public multi-tenant signup
- Dark mode (LiteLLM default is light; dark is a later experiment)

## Success for this pass

A reviewer signs in via the mock Google button, creates an idea with **作成**, and sees it on `/app/list` after reload. Empty DB still shows list chrome with **まだアイデアがありません**. Auth stays mocked. For a **採用** idea, detail **リサーチ** / **実行** persists notes across reload (Workers AI; tests stub the model).
