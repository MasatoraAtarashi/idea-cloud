# 課金とプラン

支払い処理は **まだ実装していません**。このパスは「あとから決済 SaaS を載せられる形」だけを用意したものです。決済のバグは金銭的な事故になるため、カード情報・請求・返金の扱いは自前で書かず、ホスト型チェックアウトを持つ SaaS（Stripe など）に寄せる前提です。

## 今の仕様

| プラン    | 使えるもの                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------- |
| `free`    | アイデアの作成・編集・削除、段階、コメント、自己評価、インスピレーション、検索、アナリティクス |
| `premium` | 上記すべて + AI（相談 / 評価 / リサーチ / ブレスト）、作成時の自動タグ、TypeSafe Jev           |

AI 系だけを有料にしています。AI は 1 リクエストごとに外部の推論コストが乗る唯一の機能で、他は D1 の読み書きだけだからです。

### エンタイトルメントの解決

[`server/billing/plan.ts`](../../server/billing/plan.ts) の `resolvePlan(email, env)` が唯一の判定箇所です。機能側は `isPremium()` しか呼びません。

```
PREMIUM_EMAILS 未設定 → サインイン済みの全員が premium（課金導入前。ひとりで使っている間に自分をロックアウトしないため）
PREMIUM_EMAILS 設定済 → そのリストに載っているメールだけ premium
セッションなし        → free
```

`ACCESS_ALLOWED_EMAILS`（メンバーシップ）と同じ「空ならゲートなし」の規則を踏襲しています。**ユーザーテーブルは相変わらずありません。** プランも env の設定です。

### ゲートの位置

| 経路                                                         | 挙動                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `POST /api/ideas/:id/{research,brainstorm,discuss,evaluate}` | `requirePremium` → **402** `{ error, plan: "free" }`                                              |
| `POST /api/inspirations/:id/brainstorm`                      | 同上                                                                                              |
| `POST /api/ideas`（作成）                                    | 201 のまま。自動タグと作成時 AI評価だけスキップ                                                   |
| ページの `intent=research/brainstorm/discuss/evaluate`       | アクションがフォームエラーを返す（AI は呼ばない）                                                 |
| ページの作成                                                 | 成功。自動タグと AI評価だけスキップ                                                               |
| `/mcp`                                                       | **ゲートなし。** 共有シークレットの自分用エージェント経路で、9 個のデータツールに AI は含まれない |

401（未サインイン）・403（メンバー外）・402（メンバーだが未課金）を使い分けています。

UI は `context.plan` を loader 経由で受け、AI 作業台を [`PremiumUpsell`](../../app/components/premium-upsell.tsx) に差し替えます。設定 → プロフィールに現在のプランを表示します。

## 自分をプレミアムにする

```bash
wrangler secret put PREMIUM_EMAILS   # 例: you@example.com,teammate@example.com
```

ローカルは `.dev.vars` に同じキーを書きます。未設定でも `pnpm dev` では premium 扱いなので、開発中に AI 導線が消えることはありません。

## 決済 SaaS を載せるとき（未実装）

1. Stripe に Product / Price を 1 つ作り、**Checkout（ホスト型）** と **Customer Portal** を使う。自前のカードフォームは作らない。
2. `POST /api/billing/checkout` を足し、サインイン中のメールを `customer_email` に渡してセッション URL を返す。カード情報はこの Worker を通らない。
3. Webhook `POST /api/billing/webhook`（`sessionAuth` の外・Stripe 署名で検証）で `checkout.session.completed` / `customer.subscription.deleted` を受ける。
4. `resolvePlan` の中だけを差し替える: Stripe の顧客を Google のメールで引く。**ここでもユーザーテーブルは要らない**（必要になるのは webhook の冪等性のための小さな `billing_events` くらい）。
5. `PremiumUpsell` の CTA をチェックアウトへ向ける。

`PREMIUM_EMAILS` は SaaS を載せたあとも「社内・自分用の上書き」として残す価値があります。

## やっていないこと

- 決済・サブスク・請求書・返金・使用量課金の一切
- 従量制限（プレミアム内での AI レート制限）
- プランの変更履歴、トライアル、クーポン
- チームや席数（メンバーシップは今も `ACCESS_ALLOWED_EMAILS`）
