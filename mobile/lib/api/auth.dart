import 'package:google_sign_in/google_sign_in.dart';

import 'config.dart';

/// 端末の Google Sign-In。取れた `id_token` をそのまま Bearer に載せる。
///
/// トークンは 1 時間で切れるので保存しない。毎回 Google から取り直す
/// （`attemptLightweightAuthentication` は UI を出さずに再発行してくれる）。
/// サーバ側は server/auth/google-id-token.ts で署名・aud・exp を検証する。
class GoogleAuth {
  GoogleSignInAccount? _account;
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    await GoogleSignIn.instance.initialize(clientId: googleIosClientId);
    _initialized = true;
  }

  /// 画面を出さずに前回のサインインを復元する。未サインインなら null。
  Future<String?> restoreSession() async {
    await _ensureInitialized();
    _account = await GoogleSignIn.instance.attemptLightweightAuthentication();
    return _account?.email;
  }

  /// Google のアカウント選択を出す。キャンセルされたら例外が飛ぶ。
  Future<String> signIn() async {
    await _ensureInitialized();
    final account = await GoogleSignIn.instance.authenticate();
    _account = account;
    return account.email;
  }

  Future<void> signOut() async {
    await _ensureInitialized();
    await GoogleSignIn.instance.signOut();
    _account = null;
  }

  String? get email => _account?.email;

  /// リクエストのたびに呼ぶ。期限切れのトークンを掴み続けないよう、
  /// 毎回 Google に取り直させる。
  Future<String?> idToken() async {
    await _ensureInitialized();
    final refreshed = await GoogleSignIn.instance.attemptLightweightAuthentication();
    if (refreshed != null) _account = refreshed;
    return _account?.authentication.idToken;
  }
}
