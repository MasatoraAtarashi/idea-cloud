import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/idea_source.dart';
import '../models/analytics.dart';
import 'tokens.dart';

/// 分析。Web の /app/analytics と同じ集計（GET /api/analytics）を出す。
class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key, required this.api, required this.onAuthFailure});

  final IdeaSource api;
  final Future<void> Function() onAuthFailure;

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  Analytics? _data;
  bool _loading = true;
  String? _error;
  int _span = 7;

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
      final data = await widget.api.analytics();
      if (!mounted) return;
      setState(() {
        _data = data;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('分析')),
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
    final data = _data;
    if (data == null || data.total == 0) {
      return ListView(
        children: const [
          Padding(
            padding: EdgeInsets.all(32),
            child: Center(
              child: Text('まだありません。', style: TextStyle(color: Tokens.mutedForeground)),
            ),
          ),
        ],
      );
    }

    final days = _span == 7 ? data.createdByDay7 : data.createdByDay30;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Row(
          children: [
            Expanded(child: _Stat(label: '総数', value: '${data.total}')),
            const SizedBox(width: 12),
            Expanded(
              child: _Stat(
                label: '平均の寝かせ日数',
                value: data.averageAgedDays == null
                    ? '—'
                    : data.averageAgedDays!.toStringAsFixed(1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _Stat(label: '試した', value: '${data.tried}')),
            const SizedBox(width: 12),
            Expanded(child: _Stat(label: 'AI 評価あり', value: '${data.withAiScore}')),
          ],
        ),
        _SectionTitle(
          '追加された数',
          trailing: SegmentedButton<int>(
            style: const ButtonStyle(visualDensity: VisualDensity.compact),
            segments: const [
              ButtonSegment(value: 7, label: Text('7日')),
              ButtonSegment(value: 30, label: Text('30日')),
            ],
            selected: {_span},
            showSelectedIcon: false,
            onSelectionChanged: (value) => setState(() => _span = value.first),
          ),
        ),
        _DayBars(days: days),
        const _SectionTitle('段階の内訳'),
        for (final row in data.byStage)
          _Bar(
            label: row.stage.label,
            count: row.count,
            max: data.byStage.fold(0, (a, b) => b.count > a ? b.count : a),
            color: StagePalette.of(row.stage).dot,
          ),
        if (data.topTags.isNotEmpty) ...[
          const _SectionTitle('よく使うタグ'),
          for (final row in data.topTags)
            _Bar(
              label: row.tag,
              count: row.count,
              max: data.topTags.first.count,
              color: Tokens.borderControl,
            ),
        ],
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text, {this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 28, bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            text,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: Tokens.foreground,
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: Tokens.card,
        border: Border.all(color: Tokens.borderCard),
        borderRadius: BorderRadius.circular(Tokens.radius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Tokens.mutedForeground)),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: Tokens.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

/// 日ごとの棒。Web は今日だけ濃く塗るので、それに合わせる。
class _DayBars extends StatelessWidget {
  const _DayBars({required this.days});

  final List<DayCount> days;

  @override
  Widget build(BuildContext context) {
    final max = days.fold(0, (a, b) => b.count > a ? b.count : a);
    return SizedBox(
      height: 132,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var index = 0; index < days.length; index++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1.5),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (days[index].count > 0)
                      Text(
                        '${days[index].count}',
                        style: const TextStyle(fontSize: 10, color: Tokens.mutedForeground),
                      ),
                    const SizedBox(height: 2),
                    Container(
                      height: max == 0 ? 2 : 2 + (days[index].count / max) * 84,
                      decoration: BoxDecoration(
                        color: index == days.length - 1
                            ? Tokens.foreground
                            : days[index].count == 0
                                ? Tokens.border
                                : Tokens.borderControl,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 6),
                    // 30 日表示で全部出すと潰れるので、間引く。
                    SizedBox(
                      height: 14,
                      child: days.length <= 7 || index % 5 == 0
                          ? FittedBox(
                              child: Text(
                                days[index].label,
                                style: const TextStyle(
                                  fontSize: 9.5,
                                  color: Tokens.mutedForeground,
                                ),
                              ),
                            )
                          : null,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({
    required this.label,
    required this.count,
    required this.max,
    required this.color,
  });

  final String label;
  final int count;
  final int max;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 84,
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12.5, color: Tokens.textSecondary),
            ),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: max == 0 ? 0 : count / max,
                minHeight: 8,
                backgroundColor: Tokens.muted,
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
          ),
          SizedBox(
            width: 34,
            child: Text(
              '$count',
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 12.5, color: Tokens.mutedForeground),
            ),
          ),
        ],
      ),
    );
  }
}
