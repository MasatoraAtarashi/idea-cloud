# アイデアクラウド (Idea Cloud)

アイデアをつかまえて寝かせ、熟してから見返すチームワークスペース。外山滋比古『思考の整理学』に着想しています。

このリポジトリは **画面認識用のファーストパス** です。LP と主要画面の骨格まで。保存・本認証・AI はスタブです。

## ローカルで動かす

```bash
pnpm install
cp .dev.vars.example .dev.vars   # LOCAL_DEV_USER_EMAIL を自分のメールに
pnpm db:migrate:local            # テンプレート由来の todos サンプル用
pnpm dev
```

http://localhost:5173 が LP。`はじめる` からモック画面に入れます。

| パス             | 画面                      |
| ---------------- | ------------------------- |
| `/`              | 公開 LP                   |
| `/login`         | ログイン（Access スタブ） |
| `/app/capture`   | クイックキャプチャ        |
| `/app`           | 熟成ボード（看板）        |
| `/app/ideas/:id` | アイデア詳細              |
| `/app/merge`     | 融合 / 関連               |
| `/app/research`  | リサーチ / プロトタイプ   |
| `/app/team`      | チーム設定                |

## テンプレートから何をコピーしたか

`MasatoraAtarashi/app-template` は GitHub の Template Repository ではないため、`gh repo create --template` は使っていません。squat の **`personal-fullstack`** を strict ティア・Cloudflare Access 認証ありで複製しています。

**ビジュアルについて（正直）：** スタックはテンプレート由来。最初のダーク＋ゴールド画面は LiteLLM UI を踏襲していませんでした。いまの作業画面は LiteLLM ダッシュボードの既定ライトモード（白パネル、薄いグレーボーダー、紬の主ボタン、デスクトップはサイドバー）に寄せています。

積まれているもの:

- React Router v7（SSR）+ Tailwind CSS 4 + Hono on Cloudflare Workers
- D1 + Drizzle（サンプル `todos` API は残置。UI からは外した）
- Cloudflare Access ミドルウェア（`Cf-Access-Authenticated-User-Email`）
- CI: typecheck / lint / test + gitleaks / zizmor / pnpm audit / ASH（`.github/workflows/pr.yml`）
- lefthook、Dependabot、observability 既定 ON

## スタブ / 未配線

- **ログイン**: LP のボタンは `/app` へ進むだけ。初期ゲートは **Cloudflare Access**。アプリ内 Google OAuth は後続
- **許可リスト**: `ACCESS_ALLOWED_EMAILS`（カンマ区切り）。API は見る。UI のテキストエリアは無効
- **フィールド暗号化**: `server/security/field-crypto.ts` の AES-GCM。D1 のアイデア表は未作成
- **Workers AI**: タグ付け・関係抽出・進化案はコピーのみ。`wrangler.jsonc` に未使用の AI バインディングは置いていない
- **D1 database_id**: プレースホルダ。初回は `squat deploy` または `wrangler d1 create idea-cloud-db`
- サンプル `/api/todos` はテンプレート検証用に残している

環境変数の手本は `.dev.vars.example`。secret の実体はコミットしません。本番は `wrangler secret put`。

## テンプレート側で未検証・ギャップだったこと

- `app-template` 自体は squat CLI + 複数テンプレートのモノレポ。アプリ単体ではない
- GitHub 上は **template フラグが false**（2026-09 時点）
- チーム向け purpose（`team-admin`）は coming soon。今回は `personal-fullstack` が最も近い ready テンプレート
- 認証はアプリ内 Google OAuth ではなく **Cloudflare Access**（コード不要）。許可リストは今回追加した薄い層
- Cloudflare の GitHub OIDC は未提供のため、デプロイ CI は API トークン方式（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）
- 生成直後の `wrangler.jsonc` の D1 ID はダミー。デプロイ前に実 ID が必要
- ASH / zizmor は生成アプリ CI に含まれる。ローカル pre-commit の gitleaks / zizmor は開発者マシンのツールに依存

## デプロイ

1. Cloudflare API トークン（Workers Scripts: Edit）と Account ID を GitHub secrets へ
2. D1 を作成して `wrangler.jsonc` の `database_id` を更新
3. Zero Trust で Application を追加し、Google + 許可メールのポリシーを付ける。**LP（`/`）は Access のバイパス対象にする**（アプリ配下だけ守る）
4. `main` push で `deploy.yml` がデプロイ。PR は `preview.yml` がプレビュー URL をコメント
