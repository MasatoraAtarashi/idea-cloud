import '../models/ai_notes.dart';
import '../models/analytics.dart';
import '../models/billing.dart';
import '../models/comment.dart';
import '../models/inspiration.dart';
import '../models/idea.dart';
import '../models/search.dart';
import '../models/stage.dart';
import 'idea_source.dart';

/// サーバなしで画面を触るための作り物。メモリ上だけで、再起動すると消える。
/// 実 API と同じくらいの遅延を入れて、ローディングの見え方も確認できるようにする。
class MockSource implements IdeaSource {
  MockSource() {
    _ideas.addAll(_seed());
  }

  @override
  bool get isMock => true;

  final List<Idea> _ideas = [];
  final Map<int, List<IdeaComment>> _comments = {};
  int _nextId = 100;

  static Future<void> _delay([int ms = 350]) =>
      Future<void>.delayed(Duration(milliseconds: ms));

  List<Idea> _seed() {
    final now = DateTime.now().toUtc();
    Idea make({
      required int id,
      required String title,
      required String body,
      required Stage stage,
      required List<String> tags,
      String? categoryName,
      required int agedDays,
      int commentCount = 0,
      int? aiScore,
      String? aiEvaluation,
      int? humanScore,
    }) {
      final created = now.subtract(Duration(days: agedDays));
      return Idea(
        id: id,
        title: title,
        body: body,
        stage: stage,
        tags: tags,
        categoryName: categoryName,
        createdAt: created,
        updatedAt: created,
        commentCount: commentCount,
        aiScore: aiScore,
        aiEvaluation: aiEvaluation,
        humanScore: humanScore,
      );
    }

    return [
      make(
        id: 1,
        title: '散歩中に音声でアイデアを預ける',
        body: '散歩中に音声でアイデアを預ける\n\n'
            '歩いている間は手が使えない。録音してそのまま投げると、'
            '文字起こしして 1 行目をタイトルにしてくれるだけでいい。'
            '整形は後から寝かせたときにやる。',
        stage: Stage.aging,
        tags: ['音声', 'キャプチャ'],
        categoryName: '道具',
        agedDays: 12,
        commentCount: 2,
        aiScore: 4,
        aiEvaluation: '着想としては具体的で、既存の音声メモとの差分は「寝かせる」前提の整形タイミングにある。'
            '弱いのは文字起こし精度への依存で、精度が低い日の体験をどう受け止めるかが決まっていない。'
            '先に手で 2 週間運用してみると、本当に音声が要るのかがはっきりする。',
      ),
      make(
        id: 2,
        title: '熟成度でソートする一覧',
        body: '熟成度でソートする一覧\n\n'
            '新しい順だと、寝かせたものが下に沈んで二度と見ない。'
            '「そろそろ見るべき」順に並べたい。',
        stage: Stage.ripe,
        tags: ['UI'],
        categoryName: '道具',
        agedDays: 34,
        commentCount: 1,
        aiScore: 5,
        aiEvaluation: '課題の記述が具体的で、解いたときの効果も見えている。'
            '「そろそろ見るべき」の定義さえ決めれば、そのまま作れる段階にある。',
        humanScore: 4,
      ),
      make(
        id: 3,
        title: '週末に読む論文をためる場所',
        body: '週末に読む論文をためる場所',
        stage: Stage.spark,
        tags: ['読書'],
        agedDays: 2,
      ),
      make(
        id: 4,
        title: '朝の 15 分だけ使う集中モード',
        body: '朝の 15 分だけ使う集中モード\n\n通知を全部止めて、今日やる 1 個だけ出す。',
        stage: Stage.spark,
        tags: ['習慣'],
        categoryName: '暮らし',
        agedDays: 5,
        aiScore: 3,
      ),
      make(
        id: 5,
        title: 'アイデアの共同編集',
        body: 'アイデアの共同編集\n\nひとりで使う前提を崩すので、当面はやらない。',
        stage: Stage.archived,
        tags: ['協業'],
        agedDays: 88,
      ),
    ];
  }

  int _indexOf(int id) {
    final index = _ideas.indexWhere((idea) => idea.id == id);
    if (index < 0) throw StateError('mock: id=$id が見つかりません');
    return index;
  }

  /// Idea は immutable なので、差し替えたいフィールドだけ渡して作り直す。
  Idea _copy(Idea idea, {Stage? stage, int? aiScore, String? aiEvaluation, int? commentCount}) {
    return Idea(
      id: idea.id,
      title: idea.title,
      body: idea.body,
      stage: stage ?? idea.stage,
      tags: idea.tags,
      categoryName: idea.categoryName,
      createdAt: idea.createdAt,
      updatedAt: DateTime.now().toUtc(),
      commentCount: commentCount ?? idea.commentCount,
      aiScore: aiScore ?? idea.aiScore,
      aiEvaluation: aiEvaluation ?? idea.aiEvaluation,
      humanScore: idea.humanScore,
    );
  }

  @override
  Future<List<Idea>> listIdeas() async {
    await _delay();
    return List.unmodifiable(_ideas);
  }

  @override
  Future<Idea> getIdea(int id) async {
    await _delay(200);
    return _ideas[_indexOf(id)];
  }

  @override
  Future<Idea> createIdea({required String body, Stage? stage, String? categoryName}) async {
    await _delay();
    // サーバの splitTitleBody と同じく 1 行目をタイトルにする。
    final title = body.trim().split('\n').first.trim();
    final created = Idea(
      id: _nextId++,
      title: title.isEmpty ? '無題' : title,
      body: body.trim(),
      stage: stage ?? Stage.spark,
      tags: const [],
      categoryName: categoryName,
      createdAt: DateTime.now().toUtc(),
      updatedAt: DateTime.now().toUtc(),
      commentCount: 0,
      aiScore: null,
      aiEvaluation: null,
      humanScore: null,
    );
    _ideas.insert(0, created);
    return created;
  }

  @override
  Future<Idea> updateStage(int id, Stage stage) async {
    await _delay(200);
    final index = _indexOf(id);
    final updated = _copy(_ideas[index], stage: stage);
    _ideas[index] = updated;
    return updated;
  }

  @override
  Future<void> deleteIdea(int id) async {
    await _delay(200);
    _ideas.removeAt(_indexOf(id));
    _comments.remove(id);
  }

  @override
  Future<List<IdeaComment>> listComments(int ideaId) async {
    await _delay(200);
    return List.unmodifiable(_comments[ideaId] ?? _seedComments(ideaId));
  }

  List<IdeaComment> _seedComments(int ideaId) {
    final seeded = switch (ideaId) {
      1 => [
          IdeaComment(
            id: 901,
            body: '文字起こしは iOS 標準のでいい気がする',
            authorName: 'あなた',
            createdAt: DateTime.now().toUtc().subtract(const Duration(days: 9)),
          ),
          IdeaComment(
            id: 902,
            body: '精度が低い日をどう扱うかだけ決めれば作れそう',
            authorName: 'あなた',
            createdAt: DateTime.now().toUtc().subtract(const Duration(days: 3)),
          ),
        ],
      2 => [
          IdeaComment(
            id: 903,
            body: '「そろそろ見るべき」= 熟成日数 × 未読、くらいで試す',
            authorName: 'あなた',
            createdAt: DateTime.now().toUtc().subtract(const Duration(days: 20)),
          ),
        ],
      _ => <IdeaComment>[],
    };
    _comments[ideaId] = seeded;
    return seeded;
  }

  @override
  Future<IdeaComment> addComment(int ideaId, String body) async {
    await _delay(200);
    final created = IdeaComment(
      id: _nextId++,
      body: body,
      authorName: 'あなた',
      createdAt: DateTime.now().toUtc(),
    );
    _comments.putIfAbsent(ideaId, () => _seedComments(ideaId)).add(created);
    final index = _indexOf(ideaId);
    _ideas[index] = _copy(_ideas[index], commentCount: _ideas[index].commentCount + 1);
    return created;
  }

  @override
  Future<Idea> evaluate(int ideaId) async {
    // 実際の Workers AI は数十秒かかる。待ちの見え方を確認したいので長めに。
    await _delay(2200);
    final index = _indexOf(ideaId);
    final updated = _copy(
      _ideas[index],
      aiScore: 4,
      aiEvaluation: 'これはモックの評価文です。実際の評価は Workers AI が生成します。\n\n'
          '観点としては、解こうとしている不便が具体的か、既にある道具との差分が言えるか、'
          '最初の一歩が今日の自分の手に負えるか、の 3 つを見ています。',
    );
    _ideas[index] = updated;
    return updated;
  }

  // ---- ひらめき・AI・分析・検索 -------------------------------------------

  final List<Inspiration> _inspirations = _seedInspirations();
  final Map<int, List<Brainstorm>> _brainstorms = {};
  final Map<int, List<ChatMessage>> _discussions = {};

  static List<Inspiration> _seedInspirations() {
    final now = DateTime.now().toUtc();
    return [
      Inspiration(
        id: 11,
        title: '紙のノートに戻る人たち',
        url: 'https://example.com/paper-notes',
        memo: 'デジタルに全部移した人が一部だけ紙に戻す話。境目がどこかを知りたい。',
        tags: const ['道具', '習慣'],
        createdAt: now.subtract(const Duration(days: 3)),
        ogTitle: 'Why people go back to paper',
        ogDescription: '完全移行ではなく併用に落ち着く理由を、16 人への聞き取りからまとめた。',
        ogImageUrl: '',
        ogSiteName: 'Example',
      ),
      Inspiration(
        id: 12,
        title: '熟成という言い方',
        url: null,
        memo: 'アイデアを「寝かせる」と言うとき、何が変わるのを待っているのか。',
        tags: const ['言葉'],
        createdAt: now.subtract(const Duration(days: 9)),
        ogTitle: '',
        ogDescription: '',
        ogImageUrl: '',
        ogSiteName: '',
      ),
    ];
  }

  @override
  Future<List<Brainstorm>> listBrainstorms(int ideaId) async {
    await _delay(250);
    return List.unmodifiable(_brainstorms[ideaId] ?? const []);
  }

  @override
  Future<void> brainstorm(int ideaId) async {
    await _delay(2200);
    _brainstorms.putIfAbsent(ideaId, () => []).insert(
          0,
          Brainstorm(
            id: _nextId++,
            notes: 'これはモックのブレスト結果です。\n\n'
                '・似た不便を持つ人が他にどこにいるか\n'
                '・すでにある道具で代用できてしまわないか\n'
                '・最初の一歩を今週のうちに踏めるか',
            model: 'mock',
            createdAt: DateTime.now().toUtc(),
          ),
        );
  }

  @override
  Future<List<ChatMessage>> listDiscussions(int ideaId) async {
    await _delay(250);
    return List.unmodifiable(_discussions[ideaId] ?? const []);
  }

  @override
  Future<void> discuss(int ideaId, String body) async {
    final thread = _discussions.putIfAbsent(ideaId, () => []);
    thread.add(ChatMessage(
      id: _nextId++,
      role: 'user',
      body: body,
      createdAt: DateTime.now().toUtc(),
    ));
    await _delay(1800);
    thread.add(ChatMessage(
      id: _nextId++,
      role: 'assistant',
      body: 'これはモックの返答です。実際は Workers AI が答えます。',
      createdAt: DateTime.now().toUtc(),
    ));
  }

  @override
  Future<Idea> research(int ideaId) async {
    await _delay(2400);
    final index = _indexOf(ideaId);
    final updated = _copy(
      _ideas[index],
      aiEvaluation: 'これはモックのリサーチ結果です。実際は Web 検索の結果を添えて返ります。',
    );
    _ideas[index] = updated;
    return updated;
  }

  @override
  Future<List<Inspiration>> listInspirations() async {
    await _delay();
    return List.unmodifiable(_inspirations);
  }

  @override
  Future<Inspiration> getInspiration(int id) async {
    await _delay(200);
    return _inspirations.firstWhere((item) => item.id == id);
  }

  @override
  Future<Inspiration> createInspiration({
    String? title,
    String? url,
    String? memo,
    List<String>? tags,
  }) async {
    await _delay(300);
    final created = Inspiration(
      id: _nextId++,
      title: (title?.trim().isNotEmpty ?? false) ? title!.trim() : '無題',
      url: (url?.trim().isNotEmpty ?? false) ? url!.trim() : null,
      memo: memo ?? '',
      tags: tags ?? const [],
      createdAt: DateTime.now().toUtc(),
      ogTitle: '',
      ogDescription: '',
      ogImageUrl: '',
      ogSiteName: '',
    );
    _inspirations.insert(0, created);
    return created;
  }

  @override
  Future<void> deleteInspiration(int id) async {
    await _delay(200);
    _inspirations.removeWhere((item) => item.id == id);
  }

  @override
  Future<Analytics> analytics() async {
    await _delay();
    final now = DateTime.now().toUtc();
    List<DayCount> days(int span) => [
          for (var offset = span - 1; offset >= 0; offset--)
            DayCount(
              day: now
                  .subtract(Duration(days: offset))
                  .toIso8601String()
                  .substring(0, 10),
              count: _ideas
                  .where((idea) => idea.agedDays == offset)
                  .length,
            ),
        ];
    final tagCounts = <String, int>{};
    for (final idea in _ideas) {
      for (final tag in idea.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    final topTags = tagCounts.entries.map((e) => TagCount(tag: e.key, count: e.value)).toList()
      ..sort((a, b) => b.count.compareTo(a.count));
    final aged = _ideas.map((idea) => idea.agedDays).toList()..sort();

    return Analytics(
      total: _ideas.length,
      byStage: [
        for (final stage in Stage.values)
          StageCount(
            stage: stage,
            count: _ideas.where((idea) => idea.stage == stage).length,
          ),
      ],
      averageAgedDays: aged.isEmpty
          ? null
          : aged.reduce((a, b) => a + b) / aged.length,
      medianAgedDays: aged.isEmpty ? null : aged[aged.length ~/ 2].toDouble(),
      withHumanScore: _ideas.where((idea) => idea.humanScore != null).length,
      withAiScore: _ideas.where((idea) => idea.aiScore != null).length,
      withReflection: 0,
      tried: _ideas.where((idea) => idea.stage == Stage.selected).length,
      topTags: topTags.take(8).toList(growable: false),
      createdLast7: _ideas.where((idea) => idea.agedDays < 7).length,
      createdLast30: _ideas.where((idea) => idea.agedDays < 30).length,
      createdByDay7: days(7),
      createdByDay30: days(30),
    );
  }

  @override
  Future<Billing> billing() async {
    await _delay(200);
    return const Billing(
      plan: 'free',
      status: 'none',
      currentPeriodEnd: null,
      comped: false,
      billingLive: false,
      manageable: false,
    );
  }

  @override
  Future<String> billingUrl({required bool manage}) async {
    throw UnsupportedError('モックでは課金ページを開けません。');
  }

  @override
  Future<SearchResults> search(String query) async {
    await _delay(200);
    final needle = query.trim().toLowerCase();
    if (needle.isEmpty) return SearchResults.empty;
    return SearchResults(
      query: query,
      ideas: [
        for (final idea in _ideas)
          if (idea.title.toLowerCase().contains(needle) ||
              idea.body.toLowerCase().contains(needle))
            SearchIdeaHit(
              id: idea.id,
              title: idea.title,
              stage: idea.stage,
              tags: idea.tags,
              agedDays: idea.agedDays,
              matchedIn: idea.title.toLowerCase().contains(needle) ? null : '本文に一致',
            ),
      ],
      comments: const [],
      inspirations: [
        for (final item in _inspirations)
          if (item.title.toLowerCase().contains(needle))
            SearchInspirationHit(
              id: item.id,
              title: item.title,
              domain: item.source,
              ogImageUrl: item.ogImageUrl,
            ),
      ],
      tags: [
        for (final entry in tagCountsOf(_ideas).entries)
          if (entry.key.toLowerCase().contains(needle))
            SearchTagHit(tag: entry.key, count: entry.value),
      ],
    );
  }

  static Map<String, int> tagCountsOf(List<Idea> ideas) {
    final counts = <String, int>{};
    for (final idea in ideas) {
      for (final tag in idea.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }
}
