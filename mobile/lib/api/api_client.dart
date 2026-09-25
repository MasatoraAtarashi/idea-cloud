import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/comment.dart';
import '../models/idea.dart';
import '../models/stage.dart';
import 'auth.dart';
import 'config.dart';
import 'idea_source.dart';

/// API が 2xx 以外を返したとき、または応答が読めなかったときに投げる。
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  /// 401/403 は「設定画面に戻してトークンを入れ直す」導線に使う。
  bool get isAuthFailure => statusCode == 401 || statusCode == 403;

  @override
  String toString() => message;
}

/// `/api/*` を叩く薄いクライアント。
///
/// 認証は端末の Google Sign-In で取った `id_token` の Bearer。サーバ側は
/// Cookie セッション・id_token・個人トークンのどれでも受ける
/// （server/auth/principal.ts）。
class ApiClient implements IdeaSource {
  ApiClient({required GoogleAuth auth, http.Client? httpClient})
      : _auth = auth,
        _http = httpClient ?? http.Client();

  final GoogleAuth _auth;
  final http.Client _http;

  @override
  bool get isMock => false;

  void close() => _http.close();

  @override
  Future<List<Idea>> listIdeas() async {
    final json = await _send('GET', '/api/ideas');
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Idea.fromJson)
        .toList(growable: false);
  }

  @override
  Future<Idea> getIdea(int id) async {
    final json = await _send('GET', '/api/ideas/$id');
    return Idea.fromJson(json['item'] as Map<String, dynamic>);
  }

  /// 本文の 1 行目がタイトルになる（サーバの splitTitleBody）。
  @override
  Future<Idea> createIdea({required String body, Stage? stage, String? categoryName}) async {
    final json = await _send('POST', '/api/ideas', body: {
      'body': body,
      if (stage != null) 'stage': stage.wire,
      if (categoryName != null && categoryName.isNotEmpty) 'categoryName': categoryName,
    });
    return Idea.fromJson(json['item'] as Map<String, dynamic>);
  }

  @override
  Future<Idea> updateStage(int id, Stage stage) async {
    final json = await _send('PATCH', '/api/ideas/$id', body: {'stage': stage.wire});
    return Idea.fromJson(json['item'] as Map<String, dynamic>);
  }

  @override
  Future<void> deleteIdea(int id) => _send('DELETE', '/api/ideas/$id');

  @override
  Future<List<IdeaComment>> listComments(int ideaId) async {
    final json = await _send('GET', '/api/ideas/$ideaId/comments');
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(IdeaComment.fromJson)
        .toList(growable: false);
  }

  @override
  Future<IdeaComment> addComment(int ideaId, String body) async {
    final json = await _send('POST', '/api/ideas/$ideaId/comments', body: {'body': body});
    return IdeaComment.fromJson(json['item'] as Map<String, dynamic>);
  }

  /// AI 評価。Workers 側で生成するので数十秒かかることがある。
  @override
  Future<Idea> evaluate(int ideaId) async {
    final json = await _send('POST', '/api/ideas/$ideaId/evaluate', timeout: const Duration(seconds: 120));
    return Idea.fromJson(json['item'] as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final token = await _auth.idToken();
    if (token == null || token.isEmpty) {
      // 呼び出し側が再ログインへ回せるよう 401 として扱う。
      throw ApiException('サインインが必要です。', statusCode: 401);
    }

    final request = http.Request(method, Uri.parse('$apiBaseUrl$path'))
      ..headers['authorization'] = 'Bearer $token'
      ..headers['accept'] = 'application/json';
    if (body != null) {
      request.headers['content-type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final http.Response response;
    try {
      final streamed = await _http.send(request).timeout(timeout);
      response = await http.Response.fromStream(streamed);
    } on Exception catch (error) {
      throw ApiException('通信に失敗しました: $error');
    }

    Map<String, dynamic> decoded = const {};
    if (response.body.isNotEmpty) {
      try {
        final parsed = jsonDecode(response.body);
        if (parsed is Map<String, dynamic>) decoded = parsed;
      } on FormatException {
        // JSON でない応答（Cloudflare のエラーページなど）は下で拾う。
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded['error'] as String? ?? 'HTTP ${response.statusCode}';
      throw ApiException(message, statusCode: response.statusCode);
    }
    return decoded;
  }
}
