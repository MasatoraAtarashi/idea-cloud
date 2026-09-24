import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/comment.dart';
import '../models/idea.dart';
import '../models/stage.dart';

/// 詳細。本文、AI 評価、コメント。ステージ変更と削除もここから。
class IdeaDetailPage extends StatefulWidget {
  const IdeaDetailPage({super.key, required this.api, required this.ideaId});

  final ApiClient api;
  final int ideaId;

  @override
  State<IdeaDetailPage> createState() => _IdeaDetailPageState();
}

class _IdeaDetailPageState extends State<IdeaDetailPage> {
  final _commentController = TextEditingController();
  Idea? _idea;
  List<IdeaComment> _comments = const [];
  bool _loading = true;
  bool _evaluating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() => _loading = true);
    try {
      final idea = await widget.api.getIdea(widget.ideaId);
      final comments = await widget.api.listComments(widget.ideaId);
      if (!mounted) return;
      setState(() {
        _idea = idea;
        _comments = comments;
        _loading = false;
        _error = null;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  Future<void> _changeStage(Stage stage) async {
    try {
      final updated = await widget.api.updateStage(widget.ideaId, stage);
      if (!mounted) return;
      setState(() => _idea = updated);
    } on ApiException catch (error) {
      _showError(error.message);
    }
  }

  Future<void> _evaluate() async {
    setState(() => _evaluating = true);
    try {
      final updated = await widget.api.evaluate(widget.ideaId);
      if (!mounted) return;
      setState(() => _idea = updated);
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _evaluating = false);
    }
  }

  Future<void> _addComment() async {
    final body = _commentController.text.trim();
    if (body.isEmpty) return;
    try {
      final created = await widget.api.addComment(widget.ideaId, body);
      if (!mounted) return;
      setState(() {
        _comments = [..._comments, created];
        _commentController.clear();
      });
    } on ApiException catch (error) {
      _showError(error.message);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('削除しますか'),
        content: const Text('元に戻せません。'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('やめる')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('削除')),
        ],
      ),
    );
    if (!(confirmed ?? false)) return;
    try {
      await widget.api.deleteIdea(widget.ideaId);
      if (!mounted) return;
      Navigator.of(context).pop();
    } on ApiException catch (error) {
      _showError(error.message);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final idea = _idea;
    return Scaffold(
      appBar: AppBar(
        title: Text(idea?.title ?? '読み込み中'),
        actions: [
          if (idea != null)
            IconButton(
              onPressed: _delete,
              icon: const Icon(Icons.delete_outline),
              tooltip: '削除',
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : idea == null
              ? Center(child: Text(_error ?? '読み込めませんでした'))
              : RefreshIndicator(
                  onRefresh: _reload,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      SelectableText(idea.body),
                      const SizedBox(height: 16),
                      if (idea.tags.isNotEmpty)
                        Wrap(
                          spacing: 8,
                          children: [
                            for (final tag in idea.tags) Chip(label: Text(tag)),
                          ],
                        ),
                      const SizedBox(height: 16),
                      Text('ステージ', style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          for (final stage in Stage.values)
                            ChoiceChip(
                              label: Text(stage.label),
                              selected: idea.stage == stage,
                              onSelected: (_) => _changeStage(stage),
                            ),
                        ],
                      ),
                      const Divider(height: 32),
                      _buildEvaluation(idea),
                      const Divider(height: 32),
                      Text('コメント', style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: 8),
                      for (final comment in _comments)
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(comment.body),
                          subtitle: Text(comment.authorName),
                        ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _commentController,
                              decoration: const InputDecoration(
                                hintText: 'コメントを書く',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(onPressed: _addComment, icon: const Icon(Icons.send)),
                        ],
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildEvaluation(Idea idea) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('AI 評価', style: Theme.of(context).textTheme.labelLarge),
            const Spacer(),
            if (idea.aiScore != null) Text('${idea.aiScore} / 5'),
          ],
        ),
        const SizedBox(height: 8),
        if (idea.aiEvaluation != null && idea.aiEvaluation!.isNotEmpty)
          SelectableText(idea.aiEvaluation!)
        else
          const Text('まだ評価がありません'),
        const SizedBox(height: 8),
        // 生成に時間がかかるので、進行中はボタンを潰して二重送信を防ぐ。
        FilledButton.tonal(
          onPressed: _evaluating ? null : _evaluate,
          child: Text(_evaluating ? '評価中…' : '評価しなおす'),
        ),
      ],
    );
  }
}
