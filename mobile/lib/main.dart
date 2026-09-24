import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'api/idea_source.dart';
import 'api/mock_source.dart';
import 'api/settings.dart';
import 'ui/ideas_page.dart';
import 'ui/theme.dart';

/// サーバなしで画面だけ見たいときは --dart-define=MOCK=true で起動する。
/// 既定は実 API。
const useMock = bool.fromEnvironment('MOCK');

void main() {
  final settings = Settings();
  final IdeaSource source = useMock ? MockSource() : ApiClient(settings: settings);
  runApp(IdeaCloudApp(settings: settings, api: source));
}

class IdeaCloudApp extends StatelessWidget {
  const IdeaCloudApp({super.key, required this.settings, required this.api});

  final Settings settings;
  final IdeaSource api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'アイデアクラウド',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: IdeasPage(api: api, settings: settings),
    );
  }
}
