import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../api/settings.dart';
import '../models/idea.dart';
import '../models/stage.dart';
import 'capture_sheet.dart';
import 'idea_detail_page.dart';
import 'settings_page.dart';
import 'tokens.dart';

/// 一覧。ステージで絞り込み、下に引いて再読み込み、右下から新規作成。
class IdeasPage extends StatefulWidget {
  const IdeasPage({super.key, required this.api, required this.settings});

  final IdeaSource api;
  final Settings settings;

  @override
  State<IdeasPage> createState() => _IdeasPageState();
}

class _IdeasPageState extends State<IdeasPage> {
  List<Idea> _ideas = const [];
  Stage? _filter;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // モックはサーバを見ないので設定を飛ばす。
    if (!widget.api.isMock && !await widget.settings.isConfigured()) {
      await _openSettings();
      return;
    }
    await _reload();
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
        _ideas = ideas;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
      if (error.isAuthFailure) await _openSettings();
    }
  }

  Future<void> _openSettings() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => SettingsPage(settings: widget.settings)),
    );
    if (saved ?? false) await _reload();
  }

  Future<void> _capture() async {
    final result = await showModalBottomSheet<CaptureResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Tokens.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => const CaptureSheet(),
    );
    if (result == null) return;
    try {
      final created = await widget.api.createIdea(body: result.body, stage: result.stage);
      if (!mounted) return;
      setState(() => _ideas = [created, ..._ideas]);
    } on ApiException catch (error) {
      _showError(error.message);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  List<Idea> get _visible {
    final filter = _filter;
    if (filter == null) return _ideas;
    return _ideas.where((idea) => idea.stage == filter).toList(growable: false);
  }

  /// 絞り込みの選択肢と、それぞれの件数。
  int _countFor(Stage? stage) =>
      stage == null ? _ideas.length : _ideas.where((idea) => idea.stage == stage).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('アイデアクラウド'),
        actions: [
          if (widget.api.isMock)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Center(child: _MockBadge()),
            ),
          if (!widget.api.isMock)
            IconButton(
              onPressed: _openSettings,
              icon: const Icon(Icons.settings_outlined, size: 20),
              color: Tokens.textTertiary,
              tooltip: '設定',
            ),
          const SizedBox(width: 4),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _capture,
        tooltip: 'アイデアを預ける',
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          _buildFilters(),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      color: Tokens.card,
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        children: [
          _FilterPill(
            label: 'すべて',
            count: _countFor(null),
            selected: _filter == null,
            onTap: () => setState(() => _filter = null),
          ),
          for (final stage in Stage.values)
            _FilterPill(
              label: stage.label,
              count: _countFor(stage),
              selected: _filter == stage,
              onTap: () => setState(() => _filter = stage),
            ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(strokeWidth: 2.4, color: Tokens.mutedForeground),
        ),
      );
    }

    final error = _error;
    if (error != null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Tokens.textTertiary, height: 1.6),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: SizedBox(
              width: 160,
              child: FilledButton(onPressed: _reload, child: const Text('再読み込み')),
            ),
          ),
        ],
      );
    }

    final visible = _visible;
    if (visible.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          Center(
            child: Text(
              'まだ何もありません',
              style: TextStyle(color: Tokens.mutedForeground, fontSize: 14),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      itemCount: visible.length,
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: _IdeaCard(
          idea: visible[index],
          onTap: () => _openDetail(visible[index]),
        ),
      ),
    );
  }

  Future<void> _openDetail(Idea idea) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => IdeaDetailPage(api: widget.api, ideaId: idea.id),
      ),
    );
    // 詳細で編集・削除された可能性があるので戻ったら取り直す。
    await _reload();
  }
}

class _MockBadge extends StatelessWidget {
  const _MockBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFAEB),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFFEDF89)),
      ),
      child: const Text(
        'モック',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFFB54708)),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: selected ? Tokens.foreground : Tokens.card,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: selected ? Tokens.foreground : Tokens.borderControl),
            ),
            child: Text(
              count > 0 ? '$label $count' : label,
              maxLines: 1,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.white : Tokens.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _IdeaCard extends StatelessWidget {
  const _IdeaCard({required this.idea, required this.onTap});

  final Idea idea;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Tokens.card,
      borderRadius: BorderRadius.circular(Tokens.radiusPanel),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Tokens.radiusPanel),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Tokens.radiusPanel),
            border: Border.all(color: Tokens.borderCard),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      idea.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        height: 1.45,
                        color: Tokens.foreground,
                      ),
                    ),
                  ),
                  if (idea.aiScore != null) ...[
                    const SizedBox(width: 10),
                    _ScoreBadge(score: idea.aiScore!),
                  ],
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  StagePill(stage: idea.stage),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _meta(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Tokens.mutedForeground),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _meta() {
    return [
      '${idea.agedDays}日',
      if (idea.categoryName != null) idea.categoryName!,
      if (idea.commentCount > 0) 'コメント ${idea.commentCount}',
    ].join(' · ');
  }
}

/// AI 評価スコア。数字だけの小さなバッジ。
class _ScoreBadge extends StatelessWidget {
  const _ScoreBadge({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Tokens.muted,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'AI $score',
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Tokens.textSecondary,
        ),
      ),
    );
  }
}
