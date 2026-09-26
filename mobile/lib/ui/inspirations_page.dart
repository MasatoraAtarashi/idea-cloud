import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/inspiration.dart';
import 'inspiration_detail_page.dart';
import 'inspiration_sheet.dart';
import 'tokens.dart';

/// ひらめき一覧。Web の /app/inspirations。
class InspirationsPage extends StatefulWidget {
  const InspirationsPage({super.key, required this.api, required this.onAuthFailure});

  final IdeaSource api;
  final Future<void> Function() onAuthFailure;

  @override
  State<InspirationsPage> createState() => _InspirationsPageState();
}

class _InspirationsPageState extends State<InspirationsPage> {
  List<Inspiration> _items = const [];
  bool _loading = true;
  String? _error;

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
      final items = await widget.api.listInspirations();
      if (!mounted) return;
      setState(() {
        _items = items;
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

  Future<void> _add() async {
    final input = await showModalBottomSheet<InspirationInput>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Tokens.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => const InspirationSheet(),
    );
    if (input == null) return;
    try {
      final created = await widget.api.createInspiration(
        title: input.title,
        url: input.url,
        memo: input.memo,
      );
      if (!mounted) return;
      setState(() => _items = [created, ..._items]);
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _open(Inspiration item) async {
    final deleted = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => InspirationDetailPage(api: widget.api, inspiration: item),
      ),
    );
    if (deleted ?? false) await _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ひらめき')),
      floatingActionButton: FloatingActionButton(
        onPressed: _add,
        tooltip: 'ひらめきを足す',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(onRefresh: _reload, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final error = _error;
    if (error != null) {
      return ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Text(error, style: const TextStyle(color: Tokens.danger)),
          ),
        ],
      );
    }
    if (_items.isEmpty) {
      return ListView(
        children: const [
          Padding(
            padding: EdgeInsets.all(32),
            child: Center(
              child: Text(
                'まだありません。\n気になったものを右下から足せます。',
                textAlign: TextAlign.center,
                style: TextStyle(color: Tokens.mutedForeground),
              ),
            ),
          ),
        ],
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      itemCount: _items.length,
      itemBuilder: (context, index) => _Card(item: _items[index], onTap: () => _open(_items[index])),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.item, required this.onTap});

  final Inspiration item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final summary = item.memo.trim().isNotEmpty ? item.memo.trim() : item.ogDescription;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Tokens.card,
        borderRadius: BorderRadius.circular(Tokens.radius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(Tokens.radius),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: Tokens.borderCard),
              borderRadius: BorderRadius.circular(Tokens.radius),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.ogImageUrl.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      item.ogImageUrl,
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      // 画像が落ちても行が崩れないように、枠だけ残す。
                      errorBuilder: (_, __, ___) => Container(width: 56, height: 56, color: Tokens.muted),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: Tokens.foreground,
                          height: 1.4,
                        ),
                      ),
                      if (summary.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          summary,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: Tokens.mutedForeground,
                            height: 1.45,
                          ),
                        ),
                      ],
                      if (item.source.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          item.source,
                          style: const TextStyle(fontSize: 11.5, color: Tokens.mutedForeground),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
