import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'api/settings.dart';
import 'ui/ideas_page.dart';

void main() {
  final settings = Settings();
  runApp(IdeaCloudApp(settings: settings, api: ApiClient(settings: settings)));
}

class IdeaCloudApp extends StatelessWidget {
  const IdeaCloudApp({super.key, required this.settings, required this.api});

  final Settings settings;
  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'アイデアクラウド',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF64748B)),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF64748B),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: IdeasPage(api: api, settings: settings),
    );
  }
}
