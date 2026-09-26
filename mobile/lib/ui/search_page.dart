import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/search.dart';
import 'idea_detail_page.dart';
import 'tokens.dart';

/// 検索。Web の ⌘K パレットと同じ /api/search を引く。
class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.api, required this.onAuthFailure});

  final IdeaSource api;
  final Future<void> Function() onAuthFailure;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  Timer? _debounce;
  SearchResults _results = SearchResults.empty;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  /// 一文字ごとに叩かない。入力が止まってから引く。
  void _onChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      setState(() {
        _results = SearchResults.empty;
        _loading = false;
        _error = null;
      });
      return;
    }
    setState(() => _loading = true);
    _debounce = Timer(const Duration(milliseconds: 300), () => _run(value));
  }

  Future<void> _run(String query) async {
    try {
      final results = await widget.api.search(query);
      if (!mounted || _controller.text != query) return;
      setState(() {
        _results = results;
        _loading = false;
        _error = null;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
      if (error.isAuthFailure) await widget.onAuthFailure();
    } on Object catch (error) {
      if (!mounted) return;
      setState(() {
        _error = '$error';
        _loading = false;
      });
    }
  }

  Future<void> _openIdea(int id) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => IdeaDetailPage(api: widget.api, ideaId: id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: false,
          textInputAction: TextInputAction.search,
          decoration: const InputDecoration(
            hintText: 'アイデア・コメント・ひらめきを探す',
            border: InputBorder.none,
            isDense: true,
          ),
          onChanged: _onChanged,
        ),
        actions: [
          if (_controller.text.isNotEmpty)
            IconButton(
              onPressed: () {
                _controller.clear();
                _onChanged('');
              },
              icon: const Icon(Icons.close, size: 20),
              tooltip: '消す',
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final error = _error;
    if (error != null) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Text(error, style: const TextStyle(color: Tokens.danger)),
      );
    }
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_controller.text.trim().isEmpty) {
      return const Center(
        child: Text('探したい言葉を入れてください。', style: TextStyle(color: Tokens.mutedForeground)),
      );
    }
    if (_results.isEmpty) {
      return const Center(
        child: Text('見つかりませんでした。', style: TextStyle(color: Tokens.mutedForeground)),
      );
    }

    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        if (_results.ideas.isNotEmpty) ...[
          const _GroupHeader('アイデア'),
          for (final hit in _results.ideas)
            ListTile(
              title: Text(hit.title, style: const TextStyle(fontSize: 14.5)),
              subtitle: Text(
                hit.matchedIn ?? '${hit.stage.label} · ${hit.agedDays}日',
                style: const TextStyle(fontSize: 12),
              ),
              onTap: () => _openIdea(hit.id),
            ),
        ],
        if (_results.comments.isNotEmpty) ...[
          const _GroupHeader('コメント'),
          for (final hit in _results.comments)
            ListTile(
              title: Text(
                hit.body,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14),
              ),
              subtitle: Text(hit.ideaTitle, style: const TextStyle(fontSize: 12)),
              onTap: () => _openIdea(hit.ideaId),
            ),
        ],
        if (_results.inspirations.isNotEmpty) ...[
          const _GroupHeader('ひらめき'),
          for (final hit in _results.inspirations)
            ListTile(
              title: Text(hit.title, style: const TextStyle(fontSize: 14.5)),
              subtitle: hit.domain.isEmpty
                  ? null
                  : Text(hit.domain, style: const TextStyle(fontSize: 12)),
            ),
        ],
        if (_results.tags.isNotEmpty) ...[
          const _GroupHeader('タグ'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final hit in _results.tags)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Tokens.muted,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${hit.tag} ${hit.count}',
                      style: const TextStyle(fontSize: 12, color: Tokens.textSecondary),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Tokens.mutedForeground,
        ),
      ),
    );
  }
}
