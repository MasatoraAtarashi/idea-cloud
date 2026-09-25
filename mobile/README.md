# アイデアクラウド iOS クライアント

自分ひとりで使う前提の薄い Flutter アプリ。Web と同じ `/api/*` を叩く。

## 前提

- **サーバ側に `GOOGLE_IOS_CLIENT_ID` を設定しておく。** アプリは端末の Google Sign-In で
  取った `id_token` を `Authorization: Bearer` で送り、サーバは
  `server/auth/google-id-token.ts` で署名（JWKS）・`aud`・`exp`・`email_verified` を検証する。
  通ったメールは Web と同じ `ACCESS_ALLOWED_EMAILS` に掛かる。DB は使わない。
  値は Google Cloud Console の **iOS クライアント ID**。秘密ではない（アプリに載る）が、
  照合する audience を差し替えられるよう env に置いている。
- **クライアント ID を変えたら 2 箇所直す** — `lib/api/config.dart` と
  `ios/Runner/Info.plist` の URL スキーム（クライアント ID を逆順にしたもの）。
- Flutter SDK 3.5 以上、Xcode（App Store 版。Command Line Tools だけでは iOS ビルドは通らない）。
  初回は `xcodebuild -downloadPlatform iOS` が要る（約 8GB。無いと destination が 1 つも無く、
  「No Xcode build settings have been found」で落ちる）。
- CocoaPods（`brew install cocoapods`）。`LANG` が UTF-8 でないと pod install が失敗する。
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
`ios/` は追跡しているので、Info.plist の URL スキームや署名設定は再生成しても残る。

## 使い方

初回は「Google でログイン」だけ。入力欄は無い。

- **接続先** — `lib/api/config.dart` に焼き込み。ローカルの Workers を相手にするときだけ
  `--dart-define=API_BASE_URL=http://192.168.1.17:5173` で差し替える。
- **`id_token` は保存しない** — 1 時間で切れるので、リクエストのたびに
  `attemptLightweightAuthentication` で取り直す（UI は出ない）。

401/403 が返ると自動でログイン画面に戻る。右上のアイコンでサインアウト。

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
