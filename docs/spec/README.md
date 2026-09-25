# Specs (English)

Canonical engineering docs for Idea Cloud. Product UI copy stays Japanese.

| File                                                 | Covers                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [product-requirements.md](./product-requirements.md) | Product goals, idea stages, this-pass scope                                                  |
| [architecture.md](./architecture.md)                 | Cloudflare Workers + D1                                                                      |
| [ui-ia.md](./ui-ia.md)                               | Login gate, idea list, new idea, settings, first-class analytics / inspirations, detail 履歴 |
| [e2e.md](./e2e.md)                                   | Playwright against local D1 with a localhost dev sign-in                                     |
| [security.md](./security.md)                         | In-app Google OAuth + allowlist, field encryption, CI security                               |
| [deploy-and-access.md](./deploy-and-access.md)       | First deploy, live D1 id, Access deferred until URL                                          |
| [oauth-swap.md](./oauth-swap.md)                     | The implemented auth: in-app Google OAuth, session cookie, app token                         |
| [billing.md](./billing.md)                           | Stripe Checkout + webhook, `entitlements` in D1, AI behind premium                           |
| [mcp.md](./mcp.md)                                   | Remote MCP on `/mcp`: bearer secret, nine idea/inspiration tools                             |

UI previews (not specs): [../ui-previews/](../ui-previews/).
