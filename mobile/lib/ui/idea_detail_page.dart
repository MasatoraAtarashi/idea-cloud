import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/comment.dart';
import '../models/idea.dart';
import '../models/stage.dart';
import 'tokens.dart';

/// 詳細。本文、ステージ、AI 評価、コメント。削除もここから。
class IdeaDetailPage extends StatefulWidget {
  const IdeaDetailPage({super.key, required this.api, required this.ideaId});

  final IdeaSource api;
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
        backgroundColor: Tokens.card,
        title: const Text('削除しますか', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
        content: const Text('元に戻せません。', style: TextStyle(color: Tokens.textTertiary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('やめる', style: TextStyle(color: Tokens.textTertiary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('削除', style: TextStyle(color: Tokens.danger)),
          ),
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
        title: Text(idea?.title ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (idea != null)
            IconButton(
              onPressed: _delete,
              icon: const Icon(Icons.delete_outline, size: 20),
              color: Tokens.textTertiary,
              tooltip: '削除',
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: _loading
          ? const Center(
              child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Tokens.mutedForeground),
              ),
            )
          : idea == null
              ? Center(
                  child: Text(
                    _error ?? '読み込めませんでした',
                    style: const TextStyle(color: Tokens.textTertiary),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _reload,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                    children: [
                      _buildBodyCard(idea),
                      const SizedBox(height: 10),
                      _buildStageCard(idea),
                      const SizedBox(height: 10),
                      _buildEvaluationCard(idea),
                      const SizedBox(height: 10),
                      _buildCommentsCard(),
                    ],
                  ),
                ),
    );
  }

  /// 本文の 1 行目はタイトルと同じなので、重ねて見せない。
  String _bodyWithoutTitle(Idea idea) {
    final lines = idea.body.split('\n');
    if (lines.isNotEmpty && lines.first.trim() == idea.title.trim()) {
      return lines.skip(1).join('\n').trim();
    }
    return idea.body.trim();
  }

  Widget _buildBodyCard(Idea idea) {
    final body = _bodyWithoutTitle(idea);
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            idea.title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              height: 1.5,
              color: Tokens.foreground,
            ),
          ),
          if (body.isNotEmpty) ...[
            const SizedBox(height: 10),
            SelectableText(
              body,
              style: const TextStyle(fontSize: 14, height: 1.85, color: Tokens.textSecondary),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              StagePill(stage: idea.stage),
              const SizedBox(width: 8),
              Text(
                '${idea.agedDays}日前に預けた',
                style: const TextStyle(fontSize: 12, color: Tokens.mutedForeground),
              ),
            ],
          ),
          if (idea.tags.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [for (final tag in idea.tags) _Tag(label: tag)],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStageCard(Idea idea) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel('ステージ'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final stage in Stage.values)
                _StageOption(
                  stage: stage,
                  selected: idea.stage == stage,
                  onTap: () => _changeStage(stage),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEvaluationCard(Idea idea) {
    final evaluation = idea.aiEvaluation;
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const _SectionLabel('AI 評価'),
              const Spacer(),
              if (idea.aiScore != null)
                Text(
                  '${idea.aiScore} / 5',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Tokens.textSecondary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          if (evaluation != null && evaluation.isNotEmpty)
            SelectableText(
              evaluation,
              style: const TextStyle(fontSize: 13, height: 1.9, color: Tokens.textSecondary),
            )
          else
            const Text(
              'まだ評価がありません',
              style: TextStyle(fontSize: 13, color: Tokens.mutedForeground),
            ),
          const SizedBox(height: 14),
          // 生成に時間がかかるので、進行中はボタンを潰して二重送信を防ぐ。
          _SecondaryButton(
            label: _evaluating ? '評価中…' : (evaluation == null ? '評価する' : '評価しなおす'),
            onPressed: _evaluating ? null : _evaluate,
            busy: _evaluating,
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsCard() {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionLabel('コメント${_comments.isEmpty ? '' : ' ${_comments.length}'}'),
          const SizedBox(height: 12),
          for (final comment in _comments) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Tokens.muted,
                borderRadius: BorderRadius.circular(Tokens.radius),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    comment.body,
                    style: const TextStyle(fontSize: 13, height: 1.7, color: Tokens.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    comment.authorName,
                    style: const TextStyle(fontSize: 11, color: Tokens.mutedForeground),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: TextField(
                  controller: _commentController,
                  minLines: 1,
                  maxLines: 4,
                  style: const TextStyle(fontSize: 14),
                  decoration: const InputDecoration(hintText: 'コメントを書く'),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 46,
                width: 46,
                child: Material(
                  color: Tokens.foreground,
                  borderRadius: BorderRadius.circular(Tokens.radius),
                  child: InkWell(
                    onTap: _addComment,
                    borderRadius: BorderRadius.circular(Tokens.radius),
                    child: const Icon(Icons.arrow_upward, size: 18, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Tokens.card,
        borderRadius: BorderRadius.circular(Tokens.radiusPanel),
        border: Border.all(color: Tokens.borderCard),
      ),
      child: child,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: Tokens.textTertiary,
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Tokens.muted,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, color: Tokens.textTertiary),
      ),
    );
  }
}

/// ステージ切り替え。選択中はそのステージの色で塗る。
class _StageOption extends StatelessWidget {
  const _StageOption({required this.stage, required this.selected, required this.onTap});

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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
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

class _SecondaryButton extends StatelessWidget {
  const _SecondaryButton({required this.label, required this.onPressed, this.busy = false});

  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 42,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: Tokens.textSecondary,
          side: const BorderSide(color: Tokens.borderControl),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.radius)),
          textStyle: const TextStyle(
            fontFamily: Tokens.fontFamily,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (busy) ...[
              const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: Tokens.mutedForeground),
              ),
              const SizedBox(width: 8),
            ],
            Text(label),
          ],
        ),
      ),
    );
  }
}
