import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/auth.dart';
import '../api/idea_source.dart';
import '../models/billing.dart';
import 'merge_page.dart';
import 'search_page.dart';
import 'tokens.dart';

/// 「その他」タブ。Web の /app/settings のうち、実体があるところ
/// （プロフィール・プラン・ログアウト）と、タブに載せきれない画面への入口。
class SettingsPage extends StatefulWidget {
  const SettingsPage({
    super.key,
    required this.api,
    required this.auth,
    required this.onSignOut,
    required this.onAuthFailure,
  });

  final IdeaSource api;
  final GoogleAuth auth;
  final Future<void> Function() onSignOut;
  final Future<void> Function() onAuthFailure;

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Billing? _billing;
  bool _pending = false;

  @override
  void initState() {
    super.initState();
    _loadBilling();
  }

  Future<void> _loadBilling() async {
    if (widget.api.isMock) return;
    try {
      final billing = await widget.api.billing();
      if (!mounted) return;
      setState(() => _billing = billing);
    } on Object {
      // プランが読めなくても他は使える。黙って出さない。
    }
  }

  Future<void> _openBilling({required bool manage}) async {
    setState(() => _pending = true);
    try {
      final url = await widget.api.billingUrl(manage: manage);
      final uri = Uri.tryParse(url);
      if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _pending = false);
    }
  }

  void _push(Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final billing = _billing;
    return Scaffold(
      appBar: AppBar(title: const Text('その他')),
      body: ListView(
        children: [
          const _Group('道具'),
          ListTile(
            leading: const Icon(Icons.search, color: Tokens.textTertiary),
            title: const Text('検索'),
            trailing: const Icon(Icons.chevron_right, color: Tokens.borderControl),
            onTap: () => _push(
              SearchPage(api: widget.api, onAuthFailure: widget.onAuthFailure),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.merge_outlined, color: Tokens.textTertiary),
            title: const Text('融合'),
            subtitle: const Text('2 件以上を重ねる'),
            trailing: const Icon(Icons.chevron_right, color: Tokens.borderControl),
            onTap: () => _push(
              MergePage(api: widget.api, onAuthFailure: widget.onAuthFailure),
            ),
          ),
          if (widget.api.isMock) ...[
            const _Group('表示'),
            const ListTile(
              leading: Icon(Icons.science_outlined, color: Tokens.mutedForeground),
              title: Text('モック表示'),
              subtitle: Text('サーバには繋がっていません。'),
            ),
          ] else ...[
            const _Group('アカウント'),
            ListTile(
              leading: const Icon(Icons.account_circle_outlined, color: Tokens.textTertiary),
              title: Text(widget.auth.email ?? 'サインイン中'),
              subtitle: const Text('名前とアイコンは Google の設定に従います。'),
            ),
            if (billing != null) ...[
              ListTile(
                leading: const Icon(Icons.workspace_premium_outlined, color: Tokens.textTertiary),
                title: Text(
                  billing.isPremium ? 'プレミアム（AI 機能あり）' : 'フリー（AI 機能なし）',
                ),
                subtitle: Text(_planNote(billing)),
              ),
              if (billing.billingLive)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  child: OutlinedButton(
                    onPressed: _pending
                        ? null
                        : () => _openBilling(manage: billing.manageable),
                    child: Text(
                      billing.manageable ? '支払いを管理する' : 'プレミアムにする',
                    ),
                  ),
                ),
            ],
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.logout_outlined, color: Tokens.danger),
              title: const Text('サインアウト', style: TextStyle(color: Tokens.danger)),
              onTap: widget.onSignOut,
            ),
          ],
          const SizedBox(height: 24),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'メンバー・段階とラベル・通知は Web 側でもまだ中身がありません。',
              style: TextStyle(fontSize: 11.5, color: Tokens.mutedForeground, height: 1.5),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _planNote(Billing billing) {
    if (billing.comped) return '管理者による付与のため、支払いはありません。';
    final end = billing.currentPeriodEnd;
    if (end == null || end.isEmpty) return '支払いは Stripe のページで完結します。';
    final label = end.length >= 10 ? end.substring(0, 10) : end;
    return billing.status == 'canceled' ? '利用できるのは $label まで' : '次回更新 $label';
  }
}

class _Group extends StatelessWidget {
  const _Group(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Tokens.mutedForeground,
        ),
      ),
    );
  }
}
