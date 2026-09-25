import 'package:flutter/material.dart';

import '../api/auth.dart';
import 'tokens.dart';

/// 未サインインのときに出す。押すところは 1 つだけ。
class SignInPage extends StatefulWidget {
  const SignInPage({super.key, required this.auth});

  final GoogleAuth auth;

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  bool _busy = false;
  String? _error;

  Future<void> _signIn() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.auth.signIn();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on Object catch (error) {
      if (!mounted) return;
      // キャンセルも例外で来るので、文言は「失敗」と断定しない。
      setState(() {
        _busy = false;
        _error = 'サインインできませんでした: $error';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'アイデアクラウド',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.5,
                    color: Tokens.foreground,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Web と同じ Google アカウントで入ります。',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13.5, color: Tokens.mutedForeground),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _busy ? null : _signIn,
                    child: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Google でログイン'),
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    error,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12.5, color: Tokens.danger),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
