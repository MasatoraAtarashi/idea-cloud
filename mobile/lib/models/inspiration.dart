import 'idea.dart' show parseTimestamp;

/// `GET /api/inspirations` が返す inspirationJson（db/inspirations.ts）。
class Inspiration {
  const Inspiration({
    required this.id,
    required this.title,
    required this.url,
    required this.memo,
    required this.tags,
    required this.createdAt,
    required this.ogTitle,
    required this.ogDescription,
    required this.ogImageUrl,
    required this.ogSiteName,
  });

  final int id;
  final String title;
  final String? url;
  final String memo;
  final List<String> tags;
  final DateTime? createdAt;
  final String ogTitle;
  final String ogDescription;
  final String ogImageUrl;
  final String ogSiteName;

  factory Inspiration.fromJson(Map<String, dynamic> json) {
    return Inspiration(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '無題',
      url: (json['url'] as String?)?.trim().isEmpty ?? true ? null : json['url'] as String,
      memo: json['memo'] as String? ?? '',
      tags:
          (json['tags'] as List<dynamic>? ?? const []).whereType<String>().toList(growable: false),
      createdAt: parseTimestamp(json['createdAt']),
      ogTitle: json['ogTitle'] as String? ?? '',
      ogDescription: json['ogDescription'] as String? ?? '',
      ogImageUrl: json['ogImageUrl'] as String? ?? '',
      ogSiteName: json['ogSiteName'] as String? ?? '',
    );
  }

  /// 一覧で出す出典。ogSiteName が無ければ URL のホスト名。
  String get source {
    if (ogSiteName.isNotEmpty) return ogSiteName;
    final raw = url;
    if (raw == null) return '';
    return Uri.tryParse(raw)?.host.replaceFirst('www.', '') ?? '';
  }
}
