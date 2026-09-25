import type {
  EvaluateNextId,
  JevPursueLevel,
  JevScoreLevel,
} from "../../../../server/ai/jev-evaluate";
import type { ResearchPreset } from "../../../lib/research-models";

export const ai = {
  /** AI 作業台 shell. */
  workbench: {
    title: "AI 作業台",
    presetLabel: "プリセット",
    running: "実行中",
  },

  /** Speed/quality presets. The model ids behind them are never translated. */
  preset: {
    fast: "速い・安い",
    standard: "標準",
    deep: "じっくり",
  } satisfies Record<ResearchPreset, string>,

  /** Why a run is blocked on archived ideas. */
  archive: {
    research: "アーカイブではリサーチできません",
    brainstorm: "アーカイブではブレストできません",
    evaluate: "アーカイブではAI評価できません",
    discuss: "アーカイブでは相談できません",
  },

  /** Why a run failed. Rendered from the server's error code, never its text. */
  failure: {
    research: "リサーチに失敗しました。時間をおいて再度お試しください。",
    brainstorm: "ブレストに失敗しました。時間をおいて再度お試しください。",
    evaluate: "AI評価に失敗しました。時間をおいて再度お試しください。",
    discuss: "相談の返信に失敗しました。時間をおいて再度お試しください。",
    noRoom:
      "考えているうちに返信の上限に達して、答えを書き切れませんでした。質問を短く区切って試してください。",
    badRequest: "設定が正しくありません。プリセットを選び直してください。",
    empty: "入力してください",
    tooLong: "長すぎます",
  },

  /** Bad or unknown idea id in an AI action. */
  notFound: "見つかりません",

  menu: {
    actions: "操作",
  },

  research: {
    run: "リサーチを実行",
    rerun: "もう一度リサーチ",
    running: "実行中…",
    hint: "ウェブで先行事例を数件取得し、本文と合わせて分析します。",
    sourcesHeading: "先行事例",
    webSearchUnavailable: "Web検索未取得",
    latest: "最新のリサーチ",
    comment: "AIコメント",
    notRun: "まだ実行していません。",
    emptyArchived: "調査メモはまだありません。アーカイブではリサーチできません",
  },

  brainstorm: {
    run: "ブレスト",
    running: "実行中…",
    hint: "切り口・別案・次の問いを広げます。毎回残ります。",
    latest: "最新",
    previous: "以前",
    notRun: "まだ実行していません。",
    emptyArchived: "展開はまだありません。アーカイブではブレストできません",
  },

  evaluate: {
    run: "AI評価する",
    rerun: "もう一度AI評価",
    running: "評価中…",
    /** `scoreLabel` is 推し度 from evaluation-notes. */
    hint: (scoreLabel: string) =>
      `強み・リスク・新規性・次の一手と、1–5 の${scoreLabel}。最新のみ残ります。`,
    notScored: "まだ評価していません",
    inProgress: "evaluating…",
    fullTitle: "評価の全文",
    noBody: "本文はありません。",
    notRun: "まだ評価していません。",
    emptyArchived: "評価はまだありません。アーカイブではAI評価できません",
  },

  discuss: {
    link: "AIと話す",
    intro: "このアイデアについて質問できます。法律の判断はしません。下の質問から始められます。",
    saved: "相談は保存されます",
    inputLabel: "AIへの質問",
    placeholder: "このアイデアについて聞く",
    send: "送信",
    sending: "送信中…",
    /** Tap-to-ask chips. `label` is the chip, `body` is the question that gets sent. */
    starters: [
      { label: "LPにするなら", body: "これLP作るとしたらどういう感じが良い？" },
      { label: "法的リスクは？", body: "これ法的リスクないかな？" },
      { label: "次の一手は？", body: "次の一手は？" },
      { label: "競合との差別化", body: "競合との差別化は？" },
    ],
  },

  premium: {
    title: "プレミアム限定",
    body: "AI 作業台（相談・評価・リサーチ・ブレスト）と自動タグはプレミアムプランの機能です。",
    cta: "プレミアムにする",
    opening: "開いています…",
    note: "決済は Stripe のページで完結します。アイデアの作成・編集・コメントは無料のままです。",
  },

  billing: {
    notReady: "課金は準備中です。",
    failed: "決済ページを開けませんでした。時間をおいて再度お試しください。",
  },

  /**
   * Stored Jev evaluation notes (`server/ai/jev-evaluate.ts`). Display copy only:
   * the four headings, the `スコア:` line and the Japanese values sent to / read
   * back from the Jev API stay Japanese, so old notes keep parsing.
   */
  jev: {
    /** Axis labels in the 強み / リスク bullets. */
    axis: {
      impact: "価値",
      feasibility: "実現性",
      clarity: "明確さ",
      risk: "大きさ",
      pursue: "進める価値",
    },

    /** No legend value came back for an axis. */
    noJudgement: "判定なし",

    /** 進める価値, from the `pursue` noul. */
    pursue: {
      high: "高め",
      normal: "ふつう",
      low: "低め",
      unknown: "不明",
    } satisfies Record<JevPursueLevel, string>,

    /** Jev legend value (Japanese, the API contract) -> what the reader sees. */
    level: {
      既存の延長: "既存の延長",
      一部新しい: "一部新しい",
      明確に新しい: "明確に新しい",
      大きく新しい: "大きく新しい",
      小さい: "小さい",
      ある: "ある",
      大きい: "大きい",
      非常に大きい: "非常に大きい",
      かなり困難: "かなり困難",
      難しいが可能: "難しいが可能",
      現実的: "現実的",
      容易: "容易",
      曖昧: "曖昧",
      方向は見える: "方向は見える",
      具体的: "具体的",
      すぐ動ける: "すぐ動ける",
      低い: "低い",
      中程度: "中程度",
      高い: "高い",
      致命的: "致命的",
    } satisfies Record<JevScoreLevel, string>,

    /** 次の一手. Keyed by the choice id; the Japanese criteria text is unchanged. */
    next: {
      research: "リサーチで仮説を検証する",
      age: "寝かせて熟成させる",
      try: "小さく試す",
      select: "採用へ進める",
      archive: "見送る",
    } satisfies Record<EvaluateNextId, string>,
  },

  /** Standalone /app/research screen. */
  page: {
    metaTitle: "リサーチ — アイデアクラウド",
    title: "リサーチ",
    empty: "まだありません",
    selectLabel: "採用中のアイデア",
    openDetail: "詳細を開く",
    tabResearch: "リサーチ",
    tabProto: "プロトタイプ",
    noNotes: "調査メモはまだありません。",
    protoNote: "小さな実験手順は、採用してから書きます。",
  },
};
