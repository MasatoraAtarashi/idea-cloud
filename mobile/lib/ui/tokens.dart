import 'package:flutter/material.dart';

import '../models/stage.dart';

/// Web 側 `app/app.css` の CSS 変数の写し。片方を変えたら両方直す。
abstract final class Tokens {
  static const background = Color(0xFFF9FAFB);
  static const card = Color(0xFFFFFFFF);
  static const muted = Color(0xFFF2F4F7);
  static const foreground = Color(0xFF101828);
  static const textSecondary = Color(0xFF344054);
  static const textTertiary = Color(0xFF475467);
  static const mutedForeground = Color(0xFF667085);
  static const border = Color(0xFFEAECF0);
  static const borderCard = Color(0xFFE4E7EC);
  static const borderControl = Color(0xFFD0D5DD);
  static const brand = Color(0xFF4F46E5);
  static const danger = Color(0xFFB42318);

  static const radius = 10.0;
  static const radiusPanel = 12.0;

  static const fontFamily = 'IBMPlexSansJP';
}

/// ステージごとの配色（--stage-*-bg / -fg / -dot）。
class StagePalette {
  const StagePalette({required this.background, required this.foreground, required this.dot});

  final Color background;
  final Color foreground;
  final Color dot;

  static const _map = {
    Stage.spark: StagePalette(
      background: Color(0xFFF2F4F7),
      foreground: Color(0xFF344054),
      dot: Color(0xFF98A2B3),
    ),
    Stage.aging: StagePalette(
      background: Color(0xFFFFFAEB),
      foreground: Color(0xFFB54708),
      dot: Color(0xFFF79009),
    ),
    Stage.ripe: StagePalette(
      background: Color(0xFFECFDF3),
      foreground: Color(0xFF067647),
      dot: Color(0xFF17B26A),
    ),
    Stage.selected: StagePalette(
      background: Color(0xFFEEF4FF),
      foreground: Color(0xFF3538CD),
      dot: Color(0xFF6172F3),
    ),
    Stage.archived: StagePalette(
      background: Color(0xFFF9FAFB),
      foreground: Color(0xFF667085),
      dot: Color(0xFFD0D5DD),
    ),
  };

  static StagePalette of(Stage stage) => _map[stage]!;
}

/// ステージを表す小さなピル。Web の一覧と同じ見え方にする。
class StagePill extends StatelessWidget {
  const StagePill({super.key, required this.stage});

  final Stage stage;

  @override
  Widget build(BuildContext context) {
    final palette = StagePalette.of(stage);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: palette.dot, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            stage.label,
            style: TextStyle(
              fontSize: 12,
              height: 1.2,
              fontWeight: FontWeight.w500,
              color: palette.foreground,
            ),
          ),
        ],
      ),
    );
  }
}
