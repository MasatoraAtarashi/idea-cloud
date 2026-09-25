# 課金とプラン

Stripe の **ホスト型 Checkout** と **Billing Portal** を使います。カード番号・請求・返金・解約 UI は Stripe 側にあり、この Worker には**カードデータが一切流れません**。自前で書いたのは「支払い済みか」を判定する部分だけです。

## プラン

| プラン    | 使えるもの                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------- |
| `free`    | アイデアの作成・編集・削除、段階、コメント、自己評価、インスピレーション、検索、アナリティクス |
| `premium` | 上記すべて + AI（相談 / 評価 / リサーチ / ブレスト）、作成時の自動タグ、TypeSafe Jev           |

AI 系だけを有料にしています。1 リクエストごとに外部の推論コストが乗るのは AI だけで、他は D1 の読み書きだけだからです。

## 真実の源は Stripe、キャッシュが D1

`entitlements` テーブル（[`db/entitlements.ts`](../../db/entitlements.ts)）は Webhook が書きます。Google のメールが主キーで、**プロフィールも資格情報も持ちません。支払ったことがない人の行は存在しません。** 認証とユーザー管理は引き続き Google、課金状態だけは Stripe が知っていて Google が知らないので自前で持ちます。

```
entitlements(email PK, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
billing_events(id PK, type, received_at)   -- Webhook の冪等性
```

### 判定順（[`server/billing/plan.ts`](../../server/billing/plan.ts) の `resolvePlan`）

1. セッションなし → `free`
2. `PREMIUM_EMAILS` に載っている → `premium`（オーナー / 無償付与。Stripe 不要）
3. Stripe 未設定（3 つのシークレットのどれかが空）→ `premium`（課金がまだ動いていない状態。ローンチ前と開発・e2e 用）
4. `entitlements` に有効な行がある → `premium`
5. それ以外 → `free`

機能側は `isPremium()` しか呼びません。

`status` は Stripe の値をそのまま保存します。`active` / `trialing` に加えて **`past_due` も有効**扱いです（Stripe は失敗した支払いを数日リトライするので、1 回の失敗で即停止する方が体験として悪い）。ただし `current_period_end` を過ぎたら切れます。

## ゲート

| 経路                                                                                                  | 挙動                                                                                    |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `POST /api/ideas/:id/{research,brainstorm,discuss,evaluate}`、`POST /api/inspirations/:id/brainstorm` | `requirePremium` → **402** `{ error, plan: "free" }`                                    |
| `POST /api/ideas`（作成）                                                                             | 201 のまま。自動タグと作成時 AI評価だけスキップ                                         |
| ページの `intent=research/brainstorm/discuss/evaluate`                                                | アクションがフォームエラーを返す（AI は呼ばない）                                       |
| `/mcp`                                                                                                | **ゲートなし。** 共有シークレットの自分用エージェント経路で、9 ツールに AI は含まれない |

401（未サインイン）/ 403（メンバー外）/ 402（メンバーだが未課金）を使い分けています。

## エンドポイント

| ルート                       | 認証         | 役割                                                                     |
| ---------------------------- | ------------ | ------------------------------------------------------------------------ |
| `GET /api/billing`           | セッション   | 現在のプラン・状態・次回更新日・管理可能か                               |
| `POST /api/billing/checkout` | セッション   | Stripe Checkout の URL を返す。すでに有効なら 409、Stripe 未設定なら 503 |
| `POST /api/billing/portal`   | セッション   | Billing Portal の URL を返す。顧客が無ければ 409                         |
| `POST /api/billing/webhook`  | **署名のみ** | Stripe からの通知。sessionAuth の外に置く                                |

Checkout には `client_reference_id` と `subscription_data[metadata][email]` に Google のメールを渡します。これが Webhook 側でユーザーテーブル無しに行を引ける鍵です。

### Webhook の検証

`Stripe-Signature: t=…,v1=…` を **生のボディ**に対して検証します（[`server/billing/stripe.ts`](../../server/billing/stripe.ts)）。

- 署名対象は `${t}.${rawBody}`、HMAC-SHA256、`v1` は複数あり得るのでいずれか一致で可
- 比較は定数時間（`timingSafeEqualString`）
- タイムスタンプ許容は 300 秒。過ぎたものは拒否（リプレイ対策）
- **検証を通るまで JSON としてパースしません**
- 失敗は 400。D1 エラーは 500 を返して Stripe にリトライさせます

扱うイベント: `checkout.session.completed`、`customer.subscription.created` / `.updated` / `.deleted`。それ以外は 200 で無視します。イベント id は `billing_events` に記録し、**再送は二重適用しません**。

## セットアップ（本番）

1. Stripe で Product と Price（サブスク）を 1 つ作る → `price_...` を控える
2. Webhook エンドポイントを追加: `https://<host>/api/billing/webhook`
   - 送るイベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - 署名シークレット `whsec_...` を控える
3. Billing Portal を有効化（Stripe ダッシュボード → Settings → Billing → Customer portal）
4. シークレットを投入:

```bash
wrangler secret put STRIPE_SECRET_KEY      # sk_live_... （制限キー推奨）
wrangler secret put STRIPE_PRICE_ID        # price_...
wrangler secret put STRIPE_WEBHOOK_SECRET  # whsec_...
wrangler secret put PREMIUM_EMAILS         # 自分のメール（無償付与）。任意
```

5. マイグレーション: `pnpm db:migrate:remote`

**3 つの Stripe シークレットが揃うまで課金は動きません**（`resolvePlan` の 3 番目の分岐で全員 premium のまま）。揃った瞬間に `entitlements` が効き始めるので、自分が締め出されないよう `PREMIUM_EMAILS` を先に入れておくのが安全です。

ローカルは `.dev.vars` に同じキー。テストキー（`sk_test_` / Stripe CLI の `stripe listen --forward-to localhost:5173/api/billing/webhook`）で一通り試せます。

## やっていないこと

- 複数プラン、従量課金、座席数、クーポン管理（Checkout の promotion code は有効）
- プレミアム内での AI レート制限
- 請求書の自前表示（Portal に任せる）
- チーム課金（メンバーシップは今も `ACCESS_ALLOWED_EMAILS`、課金はメール単位）
