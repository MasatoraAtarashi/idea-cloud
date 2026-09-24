import 'package:flutter_test/flutter_test.dart';
import 'package:idea_cloud_mobile/models/idea.dart';
import 'package:idea_cloud_mobile/models/stage.dart';

void main() {
  group('Idea.fromJson', () {
    test('ideaJson の形をそのまま読める', () {
      final idea = Idea.fromJson({
        'id': 12,
        'title': '週末に試す',
        'body': '週末に試す\n詳細',
        'stage': 'aging',
        'tags': ['ツール', 'AI'],
        'categoryName': '道具',
        'createdAt': '2026-09-20 08:00:00',
        'updatedAt': '2026-09-21T08:00:00Z',
        'commentCount': 3,
        'aiScore': 4,
        'aiEvaluation': 'よさそう',
        'humanScore': null,
      });

      expect(idea.id, 12);
      expect(idea.stage, Stage.aging);
      expect(idea.tags, ['ツール', 'AI']);
      expect(idea.commentCount, 3);
      expect(idea.humanScore, isNull);
      expect(idea.createdAt, DateTime.utc(2026, 9, 20, 8));
    });

    test('未知のステージは spark に寄せる（サーバの asStage と同じ）', () {
      expect(Stage.parse('unknown'), Stage.spark);
      expect(Stage.parse(null), Stage.spark);
    });

    test('欠けているフィールドがあっても落ちない', () {
      final idea = Idea.fromJson({'id': 1});
      expect(idea.title, '無題');
      expect(idea.tags, isEmpty);
      expect(idea.agedDays, 0);
    });
  });
}
