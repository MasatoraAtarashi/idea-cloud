import 'package:flutter/material.dart';

import '../api/auth.dart';
import 'tokens.dart';

/// 「その他」タブ。サインアウトの置き場。画面が増えたらここに並べる。
class AccountPage extends StatelessWidget {
  const AccountPage({
    super.key,
    required this.auth,
    required this.isMock,
    required this.onSignOut,
  });

  final GoogleAuth auth;
  final bool isMock;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final email = auth.email;
    return Scaffold(
      appBar: AppBar(title: const Text('その他')),
      body: ListView(
        children: [
          const SizedBox(height: 8),
          if (isMock)
            const ListTile(
              leading: Icon(Icons.science_outlined, color: Tokens.mutedForeground),
              title: Text('モック表示'),
              subtitle: Text('サーバには繋がっていません。'),
            )
          else ...[
            ListTile(
              leading: const Icon(Icons.account_circle_outlined, color: Tokens.textTertiary),
              title: Text(email ?? 'サインイン中'),
              subtitle: const Text('Google アカウント'),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout_outlined, color: Tokens.danger),
              title: const Text('サインアウト', style: TextStyle(color: Tokens.danger)),
              onTap: onSignOut,
            ),
          ],
        ],
      ),
    );
  }
}
