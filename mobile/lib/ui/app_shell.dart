import 'package:flutter/material.dart';

import '../api/auth.dart';
import '../api/idea_source.dart';
import 'analytics_page.dart';
import 'capture_page.dart';
import 'ideas_page.dart';
import 'inspirations_page.dart';
import 'settings_page.dart';
import 'sign_in_page.dart';
import 'tokens.dart';

/// 下タブの骨格。サインインの状態はここ一箇所で見て、各タブは
/// 401 を受けたら onAuthFailure を呼ぶだけにする。
class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.api, required this.auth});

  final IdeaSource api;
  final GoogleAuth auth;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _tab = 0;

  /// 一覧タブを外から読み直させるための鍵。預けた直後に効かせる。
  final _ideasKey = GlobalKey<IdeasPageState>();
  bool _checking = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      // モックはサーバを見ないのでサインインを飛ばす。
      if (!widget.api.isMock && await widget.auth.restoreSession() == null) {
        if (!mounted) return;
        setState(() => _checking = false);
        await _openSignIn();
        return;
      }
    } on Object catch (error) {
      // Google 側が応答しないときに黙って回り続けないよう、理由を出す。
      if (!mounted) return;
      setState(() {
        _error = 'サインインの状態を確認できませんでした: $error';
        _checking = false;
      });
      return;
    }
    if (!mounted) return;
    setState(() => _checking = false);
  }

  Future<void> _openSignIn() async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => SignInPage(auth: widget.auth)),
    );
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _signOut() async {
    await widget.auth.signOut();
    if (!mounted) return;
    setState(() => _tab = 0);
    await _openSignIn();
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final error = _error;
    if (error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Tokens.danger),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: IndexedStack(
        index: _tab,
        children: [
          CapturePage(
            api: widget.api,
            onCreated: () => _ideasKey.currentState?.reload(),
            onAuthFailure: _openSignIn,
          ),
          IdeasPage(key: _ideasKey, api: widget.api, onAuthFailure: _openSignIn),
          InspirationsPage(api: widget.api, onAuthFailure: _openSignIn),
          AnalyticsPage(api: widget.api, onAuthFailure: _openSignIn),
          SettingsPage(
            api: widget.api,
            auth: widget.auth,
            onSignOut: _signOut,
            onAuthFailure: _openSignIn,
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.edit_outlined),
            selectedIcon: Icon(Icons.edit),
            label: '預ける',
          ),
          NavigationDestination(
            icon: Icon(Icons.lightbulb_outline),
            selectedIcon: Icon(Icons.lightbulb),
            label: '一覧',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'ひらめき',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: '分析',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz_outlined),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'その他',
          ),
        ],
      ),
    );
  }
}
