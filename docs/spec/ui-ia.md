# UI information architecture

Product UI is **Japanese**. This spec is English.

## Visual language

LiteLLM dashboard default is **light**. We follow that, not the first dark+gold experiment and not the template’s gray-50 / blue-600 todo look.

| Token | Intent |
| --- | --- |
| Canvas | Off-white (`oklch(0.985 …)`) |
| Panels | White, `1px` cool gray-blue border (`#dcddeb` / `--border`) |
| Primary | Near-navy (`oklch(0.21 0.034 264.665)`), white label |
| Sidebar | White, active item: muted fill + 2px left navy bar |
| Type | Inter + IBM Plex Sans JP |
| Density | Console: compact header, small type, calm |

`color-scheme: light`. Dark mode is out of scope.

## Layout

| Viewport | Shell |
| --- | --- |
| Desktop (~1280px) | Left sidebar (キャプチャ / 熟成ボード / 融合 / リサーチ / チーム) + top session bar |
| Mobile (~390px) | No sidebar. Bottom 5-tab nav, **取る (capture) first** |

Public LP and `/login` have no app shell.

## Screen map

| Path | Japanese title | Job |
| --- | --- |
| `/` | Landing | Thesis + screen map. Public. Must stay Access-bypass. |
| `/login` | ログイン | Explains Access as the early gate. Mock CTA into `/app`. |
| `/app/capture` | クイックキャプチャ | One textarea. Classify later. Mobile primary entry. |
| `/app` | 熟成ボード | Five stage columns. Cards are title + age + tags. |
| `/app/ideas/:ideaId` | Idea detail | Body, tags, next actions (mock). |
| `/app/merge` | 融合 / 関連 | Stack two ripe ideas (mock). |
| `/app/research` | リサーチ / プロトタイプ | Only **selected** ideas. |
| `/app/team` | チーム設定 | Members, Access vs OAuth copy, disabled allowlist, crypto stub. |

Mock data: `app/data/mock.ts`. Nothing saves.

## Interaction rules

1. Capture does not ask for tags or stage.
2. Board is a shelf, not a sprint board. Do not open young cards as the default habit.
3. Research UI is gated to `selected`.
4. Empty capture submit is disabled (navy button appears gray until there is text).

## Preview artifacts

Live PNG + GitHub-safe SVG: [../ui-previews/](../ui-previews/).
