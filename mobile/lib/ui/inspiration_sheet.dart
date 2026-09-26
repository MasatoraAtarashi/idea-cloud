import 'package:flutter/material.dart';

import 'tokens.dart';

/// ひらめきの入力。URL だけ、メモだけ、どちらでも成立する（サーバ側の
/// prepareInspirationInput がタイトルを補う）。
class InspirationInput {
  const InspirationInput({this.title, this.url, this.memo});

  final String? title;
  final String? url;
  final String? memo;
}

class InspirationSheet extends StatefulWidget {
  const InspirationSheet({super.key});

  @override
  State<InspirationSheet> createState() => _InspirationSheetState();
}

class _InspirationSheetState extends State<InspirationSheet> {
  final _title = TextEditingController();
  final _url = TextEditingController();
  final _memo = TextEditingController();

  @override
  void dispose() {
    _title.dispose();
    _url.dispose();
    _memo.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _title.text.trim().isNotEmpty || _url.text.trim().isNotEmpty || _memo.text.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'ひらめきを足す',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Tokens.foreground),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _url,
            keyboardType: TextInputType.url,
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'URL（任意）'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'タイトル（任意）'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _memo,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'メモ',
              alignLabelWithHint: true,
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          const Text(
            'URL を入れるとタイトルと概要は後から自動で埋まります。',
            style: TextStyle(fontSize: 11.5, color: Tokens.mutedForeground),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _canSubmit
                ? () => Navigator.of(context).pop(
                      InspirationInput(
                        title: _title.text.trim(),
                        url: _url.text.trim(),
                        memo: _memo.text.trim(),
                      ),
                    )
                : null,
            child: const Text('足す'),
          ),
        ],
      ),
    );
  }
}
