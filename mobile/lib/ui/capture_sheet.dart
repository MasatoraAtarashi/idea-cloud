import 'package:flutter/material.dart';

import '../models/stage.dart';

/// 思いついたものを放り込むだけのシート。1 行目がタイトルになる。
class CaptureSheet extends StatefulWidget {
  const CaptureSheet({super.key});

  @override
  State<CaptureSheet> createState() => _CaptureSheetState();
}

class CaptureResult {
  const CaptureResult({required this.body, required this.stage});

  final String body;
  final Stage stage;
}

class _CaptureSheetState extends State<CaptureSheet> {
  final _controller = TextEditingController();
  Stage _stage = Stage.spark;

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
        top: 16,
        // キーボードの高さぶん持ち上げる。
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('アイデアを預ける', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            autofocus: true,
            maxLines: 6,
            minLines: 3,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              hintText: '1 行目がタイトルになります',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: SegmentedButton<Stage>(
              segments: const [
                ButtonSegment(value: Stage.spark, label: Text('着想')),
                ButtonSegment(value: Stage.aging, label: Text('熟成中')),
              ],
              selected: {_stage},
              onSelectionChanged: (selection) => setState(() => _stage = selection.first),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _submit, child: const Text('預ける')),
        ],
      ),
    );
  }
}
