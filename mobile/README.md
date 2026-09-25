# アイデアクラウド iOS クライアント

自分ひとりで使う前提の薄い Flutter アプリ。Web と同じ `/api/*` を叩く。

## 前提

- **サーバ側に `APP_API_TOKEN` を設定しておく。** `/api/*` は `server/auth/principal.ts` の
  `resolvePrincipal` が Cookie セッション（Web）か `Authorization: Bearer <APP_API_TOKEN>`
  （このアプリ）のどちらかを受ける。本番なら `wrangler secret put APP_API_TOKEN`、
  ローカルなら `.dev.vars` に書く。書き込みの帰属先は `APP_API_TOKEN_EMAIL`
  （未設定なら `ACCESS_ALLOWED_EMAILS` が 1 件のときだけそれが使われる）。
- Flutter SDK 3.5 以上、Xcode（App Store 版。Command Line Tools だけでは iOS ビルドは通らない）。
- 実機に入れるなら Apple Developer Program。未加入だと署名が 7 日で切れて入れ直しになる。

## セットアップ

プラットフォームディレクトリはコミットしていないので、最初に生成する。

```bash
cd mobile
flutter create --platforms=ios --project-name idea_cloud_mobile --org com.example .
flutter pub get
flutter run
```

`flutter create` は既存の `lib/` `test/` `pubspec.yaml` を上書きしない。
`ios/` に署名設定（Bundle Identifier、チーム）を入れたあとも残したければ、
`.gitignore` の `ios/` を外してコミットする。

## 使い方

初回起動で設定画面が出る。

- **接続先** — `https://<Workers のホスト>`。https のみ受ける（トークンを平文で流さないため）。
- **個人 API トークン** — Workers の `APP_API_TOKEN` と同じ値。iOS Keychain に入る。

401/403 が返ると自動で設定画面に戻る。トークンを回したときはここで入れ直す。

## 入っているもの

| 画面 | できること |
| --- | --- |
| 一覧 | ステージで絞り込み、引っぱって再読み込み |
| 作成 | 本文を書いて預ける（1 行目がタイトル、サーバ側で自動タグ付けと AI 評価が走る） |
| 詳細 | 本文、タグ、ステージ変更、AI 評価の再実行、コメント、削除 |

Web にあるリサーチ・壁打ち・ふりかえり・保存ビューは入れていない。
必要になってから足す。

## テスト

```bash
cd mobile && flutter test
```

## サーバ側と揃えるもの

`lib/models/stage.dart` の `Stage` は `app/data/mock.ts` の `STAGES` / `STAGE_LABEL` の写し。
ステージを増やしたら両方直す。

## サーバなしで画面だけ見る

`--dart-define=MOCK=true` を付けるとメモリ上の作り物を使う。サーバを立てずに見た目を確認するとき用。

```bash
cd mobile && flutter run --dart-define=MOCK=true
```

iPhone の Safari から見るだけなら、Xcode なしで Web ビルドを同じ Wi-Fi に配る。

```bash
cd mobile && flutter build web --dart-define=MOCK=true && (cd build/web && python3 -m http.server 8123 --bind 0.0.0.0)
```

`http://<Mac の LAN IP>:8123` を iPhone で開く。共有 → ホーム画面に追加、で全画面になる。

## 見た目

Web の v2（`app/app.css` の cool grey）に合わせている。色は `lib/ui/tokens.dart`、
書体は同梱の IBM Plex Sans JP。**フォントの同梱は見た目のためだけではない** —
Flutter Web は同梱フォントがないと CJK の字幅を測れず、チップのラベルが途中で切れる。
