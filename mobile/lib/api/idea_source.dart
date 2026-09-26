import '../models/ai_notes.dart';
import '../models/analytics.dart';
import '../models/billing.dart';
import '../models/comment.dart';
import '../models/inspiration.dart';
import '../models/idea.dart';
import '../models/search.dart';
import '../models/stage.dart';

/// 画面が使うデータ源。実 API（ApiClient）とモック（MockSource）が実装する。
/// 画面側はどちらを渡されたか知らない。
abstract class IdeaSource {
  /// モックのときだけ true。設定画面を出さず、画面に断りを出すために使う。
  bool get isMock;

  Future<List<Idea>> listIdeas();
  Future<Idea> getIdea(int id);
  Future<Idea> createIdea({required String body, Stage? stage, String? categoryName});
  Future<Idea> updateStage(int id, Stage stage);
  Future<void> deleteIdea(int id);
  Future<List<IdeaComment>> listComments(int ideaId);
  Future<IdeaComment> addComment(int ideaId, String body);
  Future<Idea> evaluate(int ideaId);

  /// アイデア詳細の AI タブ。
  Future<List<Brainstorm>> listBrainstorms(int ideaId);
  Future<void> brainstorm(int ideaId);
  Future<List<ChatMessage>> listDiscussions(int ideaId);
  Future<void> discuss(int ideaId, String body);
  Future<Idea> research(int ideaId);

  /// ひらめき。
  Future<List<Inspiration>> listInspirations();
  Future<Inspiration> getInspiration(int id);
  Future<Inspiration> createInspiration({
    String? title,
    String? url,
    String? memo,
    List<String>? tags,
  });
  Future<void> deleteInspiration(int id);

  Future<Analytics> analytics();

  /// 設定画面。プラン表示と Stripe への導線。
  Future<Billing> billing();

  /// Stripe の決済 / 管理ページの URL を返す。端末のブラウザで開く。
  Future<String> billingUrl({required bool manage});
  Future<SearchResults> search(String query);
}
