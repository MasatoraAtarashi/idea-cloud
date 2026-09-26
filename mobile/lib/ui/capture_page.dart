import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/stage.dart';
import 'tokens.dart';

/// 登録トップ。Web もスマホでは /app が投稿欄になる（prefersComposeHome）。
/// それに合わせて、アプリの最初のタブも書く場所にする。
class CapturePage extends StatefulWidget {
  const CapturePage({
    super.key,
    required this.api,
    required this.onCreated,
    required this.onAuthFailure,
  });

  final IdeaSource api;

  /// 一覧タブを読み直させる。
  final VoidCallback onCreated;
  final Future<void> Function() onAuthFailure;

  @override
  State<CapturePage> createState() => _CapturePageState();
}

class _CapturePageState extends State<CapturePage> {
  final _controller = TextEditingController();
  Stage _stage = Stage.spark;
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final body = _controller.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await widget.api.createIdea(body: body, stage: _stage);
      if (!mounted) return;
      _controller.clear();
      setState(() {
        _stage = Stage.spark;
        _sending = false;
      });
      widget.onCreated();
      FocusScope.of(context).unfocus();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('預かりました。')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      if (error.isAuthFailure) await widget.onAuthFailure();
    } on Object catch (error) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('預ける')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  maxLines: null,
                  expands: true,
                  textAlignVertical: TextAlignVertical.top,
                  style: const TextStyle(fontSize: 15, height: 1.7),
                  decoration: const InputDecoration(
                    hintText: '思いついたことを、そのまま。\n1 行目がタイトルになります。',
                    border: InputBorder.none,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    for (final stage in Stage.values)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(stage.label),
                          selected: _stage == stage,
                          onSelected: (_) => setState(() => _stage = stage),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _controller.text.trim().isEmpty || _sending ? null : _submit,
                child: _sending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Tokens.card),
                      )
                    : const Text('預ける'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
