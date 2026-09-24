import 'package:flutter/material.dart';

import '../api/settings.dart';
import 'tokens.dart';

/// 接続先 URL と個人 API トークンの入力。初回起動時と、401 が返ったときに出す。
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key, required this.settings});

  final Settings settings;

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _formKey = GlobalKey<FormState>();
  final _baseUrlController = TextEditingController();
  final _tokenController = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final baseUrl = await widget.settings.baseUrl();
    final token = await widget.settings.token();
    if (!mounted) return;
    setState(() {
      _baseUrlController.text = baseUrl ?? '';
      _tokenController.text = token ?? '';
      _loading = false;
    });
  }

  @override
  void dispose() {
    _baseUrlController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await widget.settings.save(
      baseUrl: _baseUrlController.text,
      token: _tokenController.text,
    );
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('設定')),
      body: _loading
          ? const Center(
              child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Tokens.mutedForeground),
              ),
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _baseUrlController,
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                    decoration: const InputDecoration(
                      labelText: '接続先',
                      hintText: 'https://idea-cloud.example.workers.dev',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.isEmpty) return '接続先を入力してください';
                      final uri = Uri.tryParse(text);
                      if (uri == null || !uri.isScheme('https')) {
                        // トークンを平文で流さないため https のみ受ける。
                        return 'https:// で始まる URL を入力してください';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _tokenController,
                    obscureText: true,
                    autocorrect: false,
                    enableSuggestions: false,
                    decoration: const InputDecoration(
                      labelText: '個人 API トークン',
                      helperText: 'Workers の APP_API_TOKEN と同じ値。Keychain に保存されます。',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        (value?.trim().isEmpty ?? true) ? 'トークンを入力してください' : null,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(onPressed: _save, child: const Text('保存')),
                  const SizedBox(height: 4),
                  TextButton(
                    onPressed: () async {
                      await widget.settings.clear();
                      if (!context.mounted) return;
                      _baseUrlController.clear();
                      _tokenController.clear();
                    },
                    child: const Text(
                      '保存済みの値を消す',
                      style: TextStyle(color: Tokens.textTertiary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
