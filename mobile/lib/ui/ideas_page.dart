import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/settings.dart';
import '../models/idea.dart';
import '../models/stage.dart';
import 'capture_sheet.dart';
import 'idea_detail_page.dart';
import 'settings_page.dart';

/// 一覧。ステージで絞り込み、下に引いて再読み込み、右下から新規作成。
class IdeasPage extends StatefulWidget {
  const IdeasPage({super.key, required this.api, required this.settings});

  final ApiClient api;
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
    if (!await widget.settings.isConfigured()) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('アイデアクラウド'),
        actions: [
          IconButton(
            onPressed: _openSettings,
            icon: const Icon(Icons.settings_outlined),
            tooltip: '設定',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('すべて'),
                  selected: _filter == null,
                  onSelected: (_) => setState(() => _filter = null),
                ),
                for (final stage in Stage.values) ...[
                  const SizedBox(width: 8),
                  FilterChip(
                    label: Text(stage.label),
                    selected: _filter == stage,
                    onSelected: (_) => setState(() => _filter = stage),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _capture,
        tooltip: 'アイデアを預ける',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final error = _error;
    if (error != null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Center(child: Text(error, textAlign: TextAlign.center)),
          const SizedBox(height: 12),
          Center(child: FilledButton.tonal(onPressed: _reload, child: const Text('再読み込み'))),
        ],
      );
    }

    final visible = _visible;
    if (visible.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          Center(child: Text('まだ何もありません')),
        ],
      );
    }

    return ListView.separated(
      itemCount: visible.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) => _IdeaTile(
        idea: visible[index],
        onTap: () => _openDetail(visible[index]),
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

class _IdeaTile extends StatelessWidget {
  const _IdeaTile({required this.idea, required this.onTap});

  final Idea idea;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final meta = <String>[
      idea.stage.label,
      '${idea.agedDays}日',
      if (idea.categoryName != null) idea.categoryName!,
      if (idea.commentCount > 0) '💬 ${idea.commentCount}',
      if (idea.aiScore != null) 'AI ${idea.aiScore}',
    ];
    return ListTile(
      title: Text(idea.title, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: Text(meta.join(' · ')),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
