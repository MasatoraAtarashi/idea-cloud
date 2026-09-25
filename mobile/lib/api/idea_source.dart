import '../models/comment.dart';
import '../models/idea.dart';
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
}
