import 'idea.dart' show parseTimestamp;

/// `GET /api/ideas/:id/brainstorms` の brainstormJson（db/brainstorms.ts）。
class Brainstorm {
  const Brainstorm({
    required this.id,
    required this.notes,
    required this.model,
    required this.createdAt,
  });

  final int id;
  final String notes;
  final String? model;
  final DateTime? createdAt;

  factory Brainstorm.fromJson(Map<String, dynamic> json) => Brainstorm(
        id: (json['id'] as num?)?.toInt() ?? 0,
        notes: json['notes'] as String? ?? '',
        model: json['model'] as String?,
        createdAt: parseTimestamp(json['createdAt']),
      );
}

/// `GET /api/ideas/:id/discussions` の chatMessageJson（db/discussions.ts）。
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.body,
    required this.createdAt,
  });

  final int id;

  /// "user" か "assistant"。
  final String role;
  final String body;
  final DateTime? createdAt;

  bool get isUser => role == 'user';

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: (json['id'] as num?)?.toInt() ?? 0,
        role: json['role'] as String? ?? 'assistant',
        body: json['body'] as String? ?? '',
        createdAt: parseTimestamp(json['createdAt']),
      );
}
