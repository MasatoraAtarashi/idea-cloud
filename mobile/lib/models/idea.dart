import 'stage.dart';

/// `GET /api/ideas` などが返す ideaJson（db/ideas.ts）の読み取り側。
/// アプリで使うフィールドだけを持ち、残りは無視する。
class Idea {
  const Idea({
    required this.id,
    required this.title,
    required this.body,
    required this.stage,
    required this.tags,
    required this.categoryName,
    required this.createdAt,
    required this.updatedAt,
    required this.commentCount,
    required this.aiScore,
    required this.aiEvaluation,
    required this.humanScore,
  });

  final int id;
  final String title;
  final String body;
  final Stage stage;
  final List<String> tags;
  final String? categoryName;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int commentCount;
  final int? aiScore;
  final String? aiEvaluation;
  final int? humanScore;

  factory Idea.fromJson(Map<String, dynamic> json) {
    return Idea(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '無題',
      body: json['body'] as String? ?? '',
      stage: Stage.parse(json['stage']),
      tags: (json['tags'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(growable: false),
      categoryName: json['categoryName'] as String?,
      createdAt: parseTimestamp(json['createdAt']),
      updatedAt: parseTimestamp(json['updatedAt']),
      commentCount: (json['commentCount'] as num?)?.toInt() ?? 0,
      aiScore: (json['aiScore'] as num?)?.toInt(),
      aiEvaluation: json['aiEvaluation'] as String?,
      humanScore: (json['humanScore'] as num?)?.toInt(),
    );
  }

  /// 寝かせた日数。サーバの agedDaysSince() と同じ計算。
  int get agedDays {
    final created = createdAt;
    if (created == null) return 0;
    final days = DateTime.now().toUtc().difference(created).inDays;
    return days < 0 ? 0 : days;
  }
}

/// D1 は "2026-09-24 08:31:02" 形式も返すので、T と Z を補って UTC として読む。
DateTime? parseTimestamp(Object? value) {
  if (value is! String || value.isEmpty) return null;
  final normalized = value.contains('T') ? value : '${value.replaceFirst(' ', 'T')}Z';
  return DateTime.tryParse(normalized)?.toUtc();
}
