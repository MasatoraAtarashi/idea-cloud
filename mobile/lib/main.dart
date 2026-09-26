import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'api/auth.dart';
import 'api/idea_source.dart';
import 'api/mock_source.dart';
import 'ui/app_shell.dart';
import 'ui/theme.dart';

/// サーバなしで画面だけ見たいときは --dart-define=MOCK=true で起動する。
/// 既定は実 API。
const useMock = bool.fromEnvironment('MOCK');

void main() {
  final auth = GoogleAuth();
  final IdeaSource source = useMock ? MockSource() : ApiClient(auth: auth);
  runApp(IdeaCloudApp(auth: auth, api: source));
}

class IdeaCloudApp extends StatelessWidget {
  const IdeaCloudApp({super.key, required this.auth, required this.api});

  final GoogleAuth auth;
  final IdeaSource api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'アイデアクラウド',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: AppShell(api: api, auth: auth),
    );
  }
}
