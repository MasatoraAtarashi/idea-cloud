import 'stage.dart';

/// `GET /api/analytics` が返す IdeaAnalytics（app/lib/analytics.ts）。
class Analytics {
  const Analytics({
    required this.total,
    required this.byStage,
    required this.averageAgedDays,
    required this.medianAgedDays,
    required this.withHumanScore,
    required this.withAiScore,
    required this.withReflection,
    required this.tried,
    required this.topTags,
    required this.createdLast7,
    required this.createdLast30,
    required this.createdByDay7,
    required this.createdByDay30,
  });

  final int total;
  final List<StageCount> byStage;
  final double? averageAgedDays;
  final double? medianAgedDays;
  final int withHumanScore;
  final int withAiScore;
  final int withReflection;
  final int tried;
  final List<TagCount> topTags;
  final int createdLast7;
  final int createdLast30;
  final List<DayCount> createdByDay7;
  final List<DayCount> createdByDay30;

  factory Analytics.fromJson(Map<String, dynamic> json) {
    List<T> list<T>(String key, T Function(Map<String, dynamic>) read) =>
        (json[key] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(read)
            .toList(growable: false);

    return Analytics(
      total: (json['total'] as num?)?.toInt() ?? 0,
      byStage: list('byStage', StageCount.fromJson),
      averageAgedDays: (json['averageAgedDays'] as num?)?.toDouble(),
      medianAgedDays: (json['medianAgedDays'] as num?)?.toDouble(),
      withHumanScore: (json['withHumanScore'] as num?)?.toInt() ?? 0,
      withAiScore: (json['withAiScore'] as num?)?.toInt() ?? 0,
      withReflection: (json['withReflection'] as num?)?.toInt() ?? 0,
      tried: (json['tried'] as num?)?.toInt() ?? 0,
      topTags: list('topTags', TagCount.fromJson),
      createdLast7: (json['createdLast7'] as num?)?.toInt() ?? 0,
      createdLast30: (json['createdLast30'] as num?)?.toInt() ?? 0,
      createdByDay7: list('createdByDay7', DayCount.fromJson),
      createdByDay30: list('createdByDay30', DayCount.fromJson),
    );
  }
}

class StageCount {
  const StageCount({required this.stage, required this.count});

  final Stage stage;
  final int count;

  factory StageCount.fromJson(Map<String, dynamic> json) => StageCount(
        stage: Stage.parse(json['stage']),
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}

class TagCount {
  const TagCount({required this.tag, required this.count});

  final String tag;
  final int count;

  factory TagCount.fromJson(Map<String, dynamic> json) => TagCount(
        tag: json['tag'] as String? ?? '',
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}

class DayCount {
  const DayCount({required this.day, required this.count});

  /// "2026-09-25" 形式。
  final String day;
  final int count;

  factory DayCount.fromJson(Map<String, dynamic> json) => DayCount(
        day: json['day'] as String? ?? '',
        count: (json['count'] as num?)?.toInt() ?? 0,
      );

  /// 棒グラフの軸に出す「9/25」。
  String get label {
    final parts = day.split('-');
    if (parts.length != 3) return day;
    return '${int.tryParse(parts[1]) ?? parts[1]}/${int.tryParse(parts[2]) ?? parts[2]}';
  }
}
