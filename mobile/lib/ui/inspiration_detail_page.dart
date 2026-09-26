import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/inspiration.dart';
import 'tokens.dart';

/// ひらめきの詳細。Web の /app/inspirations/:id。
class InspirationDetailPage extends StatefulWidget {
  const InspirationDetailPage({super.key, required this.api, required this.inspiration});

  final IdeaSource api;
  final Inspiration inspiration;

  @override
  State<InspirationDetailPage> createState() => _InspirationDetailPageState();
}

class _InspirationDetailPageState extends State<InspirationDetailPage> {
  late Inspiration _item = widget.inspiration;
  bool _busy = false;

  Future<void> _openUrl() async {
    final raw = _item.url;
    if (raw == null) return;
    final uri = Uri.tryParse(raw);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('リンクを開けませんでした。')),
      );
    }
  }

  Future<void> _refresh() async {
    setState(() => _busy = true);
    try {
      final fresh = await widget.api.getInspiration(_item.id);
      if (!mounted) return;
      setState(() {
        _item = fresh;
        _busy = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('消しますか？'),
        content: Text(_item.title),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('やめる')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('消す', style: TextStyle(color: Tokens.danger)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.api.deleteInspiration(_item.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = _item.url;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ひらめき'),
        actions: [
          IconButton(
            onPressed: _busy ? null : _refresh,
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: '読み直す',
          ),
          IconButton(
            onPressed: _delete,
            icon: const Icon(Icons.delete_outline, size: 20),
            color: Tokens.danger,
            tooltip: '消す',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
        children: [
          Text(
            _item.title,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w600,
              color: Tokens.foreground,
              height: 1.4,
            ),
          ),
          if (_item.source.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              _item.source,
              style: const TextStyle(fontSize: 12.5, color: Tokens.mutedForeground),
            ),
          ],
          if (_item.ogImageUrl.isNotEmpty) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(Tokens.radius),
              child: Image.network(
                _item.ogImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],
          if (_item.ogDescription.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              _item.ogDescription,
              style: const TextStyle(
                fontSize: 13.5,
                color: Tokens.textSecondary,
                height: 1.6,
              ),
            ),
          ],
          if (url != null) ...[
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _openUrl,
              icon: const Icon(Icons.open_in_new, size: 18),
              label: const Text('元のページを開く'),
            ),
          ],
          if (_item.memo.trim().isNotEmpty) ...[
            const SizedBox(height: 28),
            const Text(
              'メモ',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Tokens.foreground,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _item.memo,
              style: const TextStyle(
                fontSize: 14,
                color: Tokens.textSecondary,
                height: 1.7,
              ),
            ),
          ],
          if (_item.tags.isNotEmpty) ...[
            const SizedBox(height: 24),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final tag in _item.tags)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: Tokens.muted,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      tag,
                      style: const TextStyle(fontSize: 11.5, color: Tokens.textSecondary),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
