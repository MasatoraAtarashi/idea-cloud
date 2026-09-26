import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/idea.dart';
import '../models/stage.dart';
import 'tokens.dart';

/// 融合。Web の /app/merge と同じく、2 件以上を選ぶと重ねた一文を出す。
/// Web 側にもサーバ処理は無く、まだ下書きの段階の画面。
class MergePage extends StatefulWidget {
  const MergePage({super.key, required this.api, required this.onAuthFailure});

  final IdeaSource api;
  final Future<void> Function() onAuthFailure;

  @override
  State<MergePage> createState() => _MergePageState();
}

class _MergePageState extends State<MergePage> {
  List<Idea> _pool = const [];
  final Set<int> _selected = {};
  bool _loading = true;
  String? _error;
  String? _merged;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final ideas = await widget.api.listIdeas();
      if (!mounted) return;
      setState(() {
        // アーカイブは混ぜない（Web と同じ）。
        _pool = ideas.where((idea) => idea.stage != Stage.archived).toList(growable: false);
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
      if (error.isAuthFailure) {
        await widget.onAuthFailure();
        if (mounted) await _reload();
      }
    } on Object catch (error) {
      if (!mounted) return;
      setState(() {
        _error = '$error';
        _loading = false;
      });
    }
  }

  void _toggle(int id) {
    setState(() {
      if (!_selected.remove(id)) _selected.add(id);
      _merged = null;
    });
  }

  void _merge() {
    final titles = _pool
        .where((idea) => _selected.contains(idea.id))
        .map((idea) => idea.title)
        .join(' × ');
    setState(() => _merged = '$titles をひとつに重ねます。');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('融合')),
      bottomNavigationBar: _loading || _error != null ? null : _buildFooter(),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final error = _error;
    if (error != null) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Text(error, style: const TextStyle(color: Tokens.danger)),
      );
    }
    if (_pool.isEmpty) {
      return const Center(
        child: Text('まだありません。', style: TextStyle(color: Tokens.mutedForeground)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      itemCount: _pool.length,
      itemBuilder: (context, index) {
        final idea = _pool[index];
        return CheckboxListTile(
          value: _selected.contains(idea.id),
          onChanged: (_) => _toggle(idea.id),
          controlAffinity: ListTileControlAffinity.leading,
          title: Text(idea.title, style: const TextStyle(fontSize: 14.5, height: 1.4)),
          subtitle: Text(idea.stage.label, style: const TextStyle(fontSize: 12)),
        );
      },
    );
  }

  Widget _buildFooter() {
    final merged = _merged;
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          color: Tokens.card,
          border: Border(top: BorderSide(color: Tokens.border)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              merged ?? '2 件以上選ぶと、重ねた一文がここに出ます。',
              style: TextStyle(
                fontSize: 12.5,
                height: 1.5,
                color: merged == null ? Tokens.mutedForeground : Tokens.foreground,
              ),
            ),
            const SizedBox(height: 10),
            FilledButton(
              onPressed: _selected.length >= 2 ? _merge : null,
              child: Text('融合する（${_selected.length} 件）'),
            ),
          ],
        ),
      ),
    );
  }
}
