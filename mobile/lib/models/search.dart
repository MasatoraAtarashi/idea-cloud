import 'stage.dart';

/// `GET /api/search?q=` が返す SearchResults（db/search.ts）。
class SearchResults {
  const SearchResults({
    required this.query,
    required this.ideas,
    required this.comments,
    required this.inspirations,
    required this.tags,
  });

  final String query;
  final List<SearchIdeaHit> ideas;
  final List<SearchCommentHit> comments;
  final List<SearchInspirationHit> inspirations;
  final List<SearchTagHit> tags;

  static const empty = SearchResults(
    query: '',
    ideas: [],
    comments: [],
    inspirations: [],
    tags: [],
  );

  bool get isEmpty =>
      ideas.isEmpty && comments.isEmpty && inspirations.isEmpty && tags.isEmpty;

  factory SearchResults.fromJson(Map<String, dynamic> json) {
    List<T> list<T>(String key, T Function(Map<String, dynamic>) read) =>
        (json[key] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(read)
            .toList(growable: false);

    return SearchResults(
      query: json['query'] as String? ?? '',
      ideas: list('ideas', SearchIdeaHit.fromJson),
      comments: list('comments', SearchCommentHit.fromJson),
      inspirations: list('inspirations', SearchInspirationHit.fromJson),
      tags: list('tags', SearchTagHit.fromJson),
    );
  }
}

class SearchIdeaHit {
  const SearchIdeaHit({
    required this.id,
    required this.title,
    required this.stage,
    required this.tags,
    required this.agedDays,
    required this.matchedIn,
  });

  final int id;
  final String title;
  final Stage stage;
  final List<String> tags;
  final int agedDays;

  /// 本文だけが当たったときの抜粋。タイトルが当たったときは null。
  final String? matchedIn;

  factory SearchIdeaHit.fromJson(Map<String, dynamic> json) => SearchIdeaHit(
        id: int.tryParse('${json['id']}') ?? 0,
        title: json['title'] as String? ?? '無題',
        stage: Stage.parse(json['stage']),
        tags: (json['tags'] as List<dynamic>? ?? const [])
            .whereType<String>()
            .toList(growable: false),
        agedDays: (json['agedDays'] as num?)?.toInt() ?? 0,
        matchedIn: json['matchedIn'] as String?,
      );
}

class SearchCommentHit {
  const SearchCommentHit({
    required this.id,
    required this.body,
    required this.ideaId,
    required this.ideaTitle,
  });

  final int id;
  final String body;
  final int ideaId;
  final String ideaTitle;

  factory SearchCommentHit.fromJson(Map<String, dynamic> json) => SearchCommentHit(
        id: (json['id'] as num?)?.toInt() ?? 0,
        body: json['body'] as String? ?? '',
        ideaId: int.tryParse('${json['ideaId']}') ?? 0,
        ideaTitle: json['ideaTitle'] as String? ?? '無題',
      );
}

class SearchInspirationHit {
  const SearchInspirationHit({
    required this.id,
    required this.title,
    required this.domain,
    required this.ogImageUrl,
  });

  final int id;
  final String title;
  final String domain;
  final String ogImageUrl;

  factory SearchInspirationHit.fromJson(Map<String, dynamic> json) => SearchInspirationHit(
        id: int.tryParse('${json['id']}') ?? 0,
        title: json['title'] as String? ?? '無題',
        domain: json['domain'] as String? ?? '',
        ogImageUrl: json['ogImageUrl'] as String? ?? '',
      );
}

class SearchTagHit {
  const SearchTagHit({required this.tag, required this.count});

  final String tag;
  final int count;

  factory SearchTagHit.fromJson(Map<String, dynamic> json) => SearchTagHit(
        tag: json['tag'] as String? ?? '',
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}
