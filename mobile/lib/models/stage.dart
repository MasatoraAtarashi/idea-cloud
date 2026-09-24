/// server 側 `app/data/mock.ts` の STAGES / STAGE_LABEL に対応する。
/// 片方を変えたら必ずもう片方も合わせること。
enum Stage {
  spark('spark', '着想'),
  aging('aging', '熟成中'),
  ripe('ripe', '熟した'),
  selected('selected', '採用'),
  archived('archived', 'アーカイブ');

  const Stage(this.wire, this.label);

  /// API がやり取りする文字列。
  final String wire;

  /// 画面に出す日本語。
  final String label;

  /// 未知の値はサーバの asStage() と同じく spark に寄せる。
  static Stage parse(Object? value) {
    for (final stage in Stage.values) {
      if (stage.wire == value) return stage;
    }
    return Stage.spark;
  }
}
