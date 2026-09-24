import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// 接続先とトークンの置き場。トークンは Keychain に入れ、ソースにも
/// UserDefaults にも残さない。
class Settings {
  Settings({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
            );

  final FlutterSecureStorage _storage;

  static const _baseUrlKey = 'base_url';
  static const _tokenKey = 'api_token';

  Future<String?> baseUrl() => _storage.read(key: _baseUrlKey);

  Future<String?> token() => _storage.read(key: _tokenKey);

  Future<bool> isConfigured() async {
    final url = await baseUrl();
    final apiToken = await token();
    return (url?.isNotEmpty ?? false) && (apiToken?.isNotEmpty ?? false);
  }

  Future<void> save({required String baseUrl, required String token}) async {
    // 末尾スラッシュがあると /api の連結が // になるので落としておく。
    final trimmed = baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    await _storage.write(key: _baseUrlKey, value: trimmed);
    await _storage.write(key: _tokenKey, value: token.trim());
  }

  Future<void> clear() async {
    await _storage.delete(key: _baseUrlKey);
    await _storage.delete(key: _tokenKey);
  }
}
