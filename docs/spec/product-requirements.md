# Product requirements

Inspired by Toyama Shigehiko’s _The Science of Thought Organization_ (思考の整理学): ideas get better when they are captured quickly, left alone, and reviewed only after time has passed.

**Audience:** Masatora Atarashi and a small closed team (Atarashi Lab). Solo-usable, team-default.

**Language:** Japanese product UI. English engineering docs (`docs/spec/`, README).

## Problem

Most note apps optimize for capture _and_ immediate polishing. That kills the forgetting period the book treats as the real work. Idea Cloud is a shelf for time, not a progress tracker.

## Goals (this first pass)

1. Login is the first screen (`/` → `/login`). No public marketing LP.
2. Clickable UI shell for the working screens, **empty** until capture (not a dummy board).
3. Visual direction: quiet LiteLLM-like **light** console (see [ui-ia.md](./ui-ia.md)).
4. Security stubs that match the intended posture: Cloudflare Access as the early gate, allowlist, AES-GCM helper (see [security.md](./security.md)).
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

See [ui-ia.md](./ui-ia.md). Paths: `/` (redirect), `/login`, `/app/capture`, `/app`, `/app/ideas/:id`, `/app/merge`, `/app/research`, `/app/team`.

## Out of scope (this pass)

- Persisting ideas to D1 (no idea table yet)
- In-app Google OAuth (Access first)
- Workers AI tagging, relation extraction, evolution suggestions (copy-only)
- Native apps
- Public multi-tenant signup
- Dark mode (LiteLLM default is light; dark is a later experiment)

## Success for this pass

A reviewer hitting `/` sees login, then an empty LiteLLM-like idea table — not a pitch page or fake kanban. Backend, crypto wiring, and live Cloudflare URL can follow after visual sign-off.
