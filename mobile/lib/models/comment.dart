import 'idea.dart' show parseTimestamp;

/// `GET /api/ideas/:id/comments` が返す commentJson（db/comments.ts）。
class IdeaComment {
  const IdeaComment({
    required this.id,
    required this.body,
    required this.authorName,
    required this.createdAt,
  });

  final int id;
  final String body;
  final String authorName;
  final DateTime? createdAt;

  factory IdeaComment.fromJson(Map<String, dynamic> json) {
    return IdeaComment(
      id: (json['id'] as num).toInt(),
      body: json['body'] as String? ?? '',
      authorName: json['authorName'] as String? ?? '',
      createdAt: parseTimestamp(json['createdAt']),
    );
  }
}
