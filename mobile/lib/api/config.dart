/// 接続先は 1 つしかないので焼き込む。ユーザーに URL を打たせる意味がない。
/// ローカルの Workers を相手にしたいときだけ
/// `--dart-define=API_BASE_URL=http://192.168.1.17:5173` で差し替える。
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://idea-cloud.kaito-technology.workers.dev',
);

/// Google Cloud Console で作った iOS クライアント。秘密ではない
/// （アプリのバイナリに載る前提のもので、Google もそう設計している）。
/// サーバ側は GOOGLE_IOS_CLIENT_ID として同じ値を持ち、id_token の aud を照合する。
const googleIosClientId =
    '1065377930442-pfala6o7lvmbobvltm414flo8gng6mhs.apps.googleusercontent.com';
