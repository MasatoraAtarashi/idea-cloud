# Product requirements

Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学): ideas get better when they are captured quickly, left alone, and reviewed only after time has passed.

**Audience:** Masatora Atarashi and a small closed team (Atarashi Lab). Solo-usable, team-default.

**Language:** Japanese product UI. English engineering docs (`docs/spec/`, README).

## Problem

Most note apps optimize for capture _and_ immediate polishing. That kills the forgetting period the book treats as the real work. Idea Cloud is a shelf for time, not a progress tracker.

## Goals (this first pass)

1. Public surface is a quiet Japanese **login gate** only (`/` and `/login`). No landing page.
2. Clickable UI shell for the working screens (not a full product). Empty states — no dummy ideas or invented teammates.
3. Visual direction: LiteLLM Admin **light** chrome + Relic in-app list IA (see [ui-ia.md](./ui-ia.md)). Not Relic’s blue marketing LP.
4. Security stubs that match the intended posture: in-app Google OAuth later, allowlist, AES-GCM helper (see [security.md](./security.md)). Login is a Google-looking mock into `/app`.
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

- Mobile is for capture. Desktop is for judgment.
- Do not research an idea until it is **selected**.
- Discarding is a first-class ritual, not a silent delete.

## Screens in scope

See [ui-ia.md](./ui-ia.md). Paths: `/app` (mobile capture home; desktop → `/app/list`), `/app/capture` (capture alias), `/app/list` (desktop list home / mobile 一覧), `/app/ideas/:id`, `/app/merge`, `/app/research`, `/app/team`.

## Out of scope (this pass)

- Persisting ideas to D1 (no idea table yet)
- In-app Google OAuth (Access first)
- Workers AI tagging, relation extraction, evolution suggestions (copy-only)
- Native apps
- Public multi-tenant signup
- Dark mode (LiteLLM default is light; dark is a later experiment)

## Success for this pass

A reviewer enters `/app` and lands on **capture** on mobile and **list** (`/app/list`) on desktop. No dummy ideas. LiteLLM chrome; Relic list IA only when rows exist. Backend, crypto wiring, and real OAuth can follow after visual sign-off.
