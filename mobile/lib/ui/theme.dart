import 'package:flutter/material.dart';

import 'tokens.dart';

/// Web の v2（cool grey）に寄せたライトテーマ。
ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: Tokens.fontFamily,
    colorScheme: ColorScheme.fromSeed(
      seedColor: Tokens.brand,
      surface: Tokens.card,
    ),
    scaffoldBackgroundColor: Tokens.background,
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: Tokens.card,
      surfaceTintColor: Colors.transparent,
      foregroundColor: Tokens.foreground,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: Tokens.fontFamily,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: Tokens.foreground,
      ),
    ),
    dividerTheme: const DividerThemeData(color: Tokens.border, thickness: 1, space: 1),
    textTheme: base.textTheme.apply(
      bodyColor: Tokens.foreground,
      displayColor: Tokens.foreground,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Tokens.card,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Tokens.radius),
        borderSide: const BorderSide(color: Tokens.borderControl),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Tokens.radius),
        borderSide: const BorderSide(color: Tokens.borderControl),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Tokens.radius),
        borderSide: const BorderSide(color: Tokens.brand, width: 1.5),
      ),
      hintStyle: const TextStyle(color: Tokens.mutedForeground),
      labelStyle: const TextStyle(color: Tokens.textTertiary),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Tokens.foreground,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.radius)),
        textStyle: const TextStyle(
          fontFamily: Tokens.fontFamily,
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: Tokens.foreground,
      foregroundColor: Colors.white,
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: Tokens.foreground,
      contentTextStyle: TextStyle(fontFamily: Tokens.fontFamily, color: Colors.white),
      behavior: SnackBarBehavior.floating,
    ),
  );
}
