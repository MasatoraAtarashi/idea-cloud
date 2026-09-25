import type { Stage } from "../../../data/mock";

export const common = {
  appName: "アイデアクラウド",
  language: "言語",
  openApp: "アプリを開く",
  signIn: "ログイン",
  signOut: "ログアウト",
  getStarted: "無料ではじめる",
  close: "閉じる",
  cancel: "キャンセル",
  save: "保存",
  back: "戻る",

  /** Stage names. The ids live in app/data/mock.ts; only the copy is per-locale. */
  stage: {
    spark: "着想",
    aging: "熟成中",
    ripe: "熟した",
    selected: "採用",
    archived: "アーカイブ",
  } satisfies Record<Stage, string>,
  stageHint: {
    spark: "預けた直後",
    aging: "寝かせて観点が増える",
    ripe: "見直しの対象",
    selected: "実行へ進んだ",
    archived: "今は動かさない",
  } satisfies Record<Stage, string>,
  /** Fallback display name when there is no session email. */
  sessionUser: "ログイン中",
  self: "自分",
};
