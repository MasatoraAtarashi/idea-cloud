import 'package:flutter/material.dart';

import '../models/stage.dart';
import 'tokens.dart';

class CaptureResult {
  const CaptureResult({required this.body, required this.stage});

  final String body;
  final Stage stage;
}

/// 思いついたものを放り込むだけのシート。1 行目がタイトルになる。
class CaptureSheet extends StatefulWidget {
  const CaptureSheet({super.key});

  @override
  State<CaptureSheet> createState() => _CaptureSheetState();
}

class _CaptureSheetState extends State<CaptureSheet> {
  final _controller = TextEditingController();
  Stage _stage = Stage.spark;
  bool _canSubmit = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final canSubmit = _controller.text.trim().isNotEmpty;
      if (canSubmit != _canSubmit) setState(() => _canSubmit = canSubmit);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final body = _controller.text.trim();
    if (body.isEmpty) return;
    Navigator.of(context).pop(CaptureResult(body: body, stage: _stage));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        // キーボードの高さぶん持ち上げる。
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Tokens.borderControl,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'アイデアを預ける',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Tokens.foreground),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            autofocus: true,
            maxLines: 6,
            minLines: 4,
            style: const TextStyle(fontSize: 14, height: 1.7),
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(hintText: '1 行目がタイトルになります'),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              for (final stage in [Stage.spark, Stage.aging])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _StageToggle(
                    stage: stage,
                    selected: _stage == stage,
                    onTap: () => setState(() => _stage = stage),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _canSubmit ? _submit : null,
            child: const Text('預ける'),
          ),
        ],
      ),
    );
  }
}

class _StageToggle extends StatelessWidget {
  const _StageToggle({required this.stage, required this.selected, required this.onTap});

  final Stage stage;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = StagePalette.of(stage);
    return Material(
      color: selected ? palette.background : Tokens.card,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? palette.dot : Tokens.borderControl),
          ),
          child: Text(
            stage.label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: selected ? palette.foreground : Tokens.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
