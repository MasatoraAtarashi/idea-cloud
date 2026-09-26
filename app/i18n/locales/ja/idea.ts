export const idea = {
  metaTitle: "アイデア — アイデアクラウド",
  heading: "アイデア",
  empty: "まだありません",
  listLink: "一覧",
  backToList: "一覧へ戻る",
  editButton: "編集",
  aiTab: "AI 作業台",
  /** Compact mono chip next to the stage, e.g. `12d`. */
  agedDaysShort: (days: number) => `${days}d`,
  noAutoTags: "自動タグなし",

  nextStage: "次の段階へ",
  nextStageTo: (stage: string) => `次の段階へ（${stage}）`,
  nextStageArchived: "アーカイブでは進められません",
  nextStageLast: "最後の段階です",
  updating: "更新中…",
  moreActions: "その他の操作",
  changeStage: "段階を変更",
  mergeWithOther: "他のアイデアと融合",
  archive: "アーカイブ",
  untitled: "無題",

  selfReview: {
    heading: "自分の評価と振り返り",
    open: "開く",
    score: (score: number) => `自分の点数 ${score}`,
    hasReflection: "振り返りあり",
  },

  merge: {
    metaTitle: "融合 — アイデアクラウド",
    heading: "融合",
    detail: "詳細",
    selected: (count: number) => `選択中 ${count} 件`,
    submit: "融合する",
    hint: "2 件以上選ぶと、重ねた一文がここに出ます。",
    result: (titles: string) => `${titles} をひとつに重ねます。`,
  },

  edit: {
    title: "タイトル",
    body: "本文",
    tags: "タグ",
    tagsPlaceholder: "カンマまたは読点で区切る",
    category: "カテゴリ",
    stage: "段階",
    saving: "保存中…",
  },

  comments: {
    heading: "コメント",
    empty: "まだコメントはありません。あとから少しずつ残せます。",
    placeholder: "あとから気づいたことを書く",
    sendLabel: "コメント送信",
    addAs: (name: string) => `${name} として追加（⌘Enter）`,
    send: "送信",
    sending: "送信中…",
  },

  actions: {
    menuLabel: "操作",
    delete: "削除",
    deleting: "削除中…",
  },

  copy: {
    label: "コピー",
    aria: "説明を含めてコピー",
    result: "コピーの結果",
    ok: "コピーしました",
    fail: "コピーできませんでした",
    stageField: "段階",
    categoryField: "カテゴリ",
    tagsField: "タグ",
  },

  swipe: {
    ai: "AI",
    merge: "融合",
  },

  score: {
    heading: "評価",
    hint: "1–5 の点数。任意で短いメモを残せます。",
    noteLabel: "評価メモ",
    notePlaceholder: "短いメモ（任意）",
    human: (score: number) => `人${score}`,
    ai: (score: number) => `AI${score}`,
  },

  review: {
    heading: "見直し",
    hint: "寝かせたあと、進めるか一旦止めるかを決めます。",
    current: (status: string) => ` いまは${status}。`,
    reviewed: "見直した",
    hold: "保留",
    discard: "捨てる",
    discardPrompt: "アーカイブして棚から下ろすか、完全に削除するか選べます。",
    rested: (days: number) => `${days}日寝かせました。いま読み返してどう見えますか。`,
    archive: "アーカイブする",
    delete: "削除する",
    cancel: "やめる",
  },

  reflection: {
    heading: "振り返り",
    hint: "試したあとの結果だけ残します。AIにはまだ使いません。",
    outcomeLabel: "やってみた結果",
    outcomePlaceholder: "やってみた結果",
    notesLabel: "振り返りメモ",
    notesPlaceholder: "メモ（任意）",
    submit: "振り返りを保存",
    saving: "保存中…",
    status: {
      none: "未記入",
      tried: "試した",
      hold: "保留",
      dropped: "やめた",
    },
  },

  tabs: {
    discuss: "相談",
    evaluate: "評価",
    research: "リサーチ",
    brainstorm: "ブレスト",
  },

  /** AI evaluation. The stored notes stay Japanese; only these labels are translated. */
  evaluation: {
    scoreLabel: "推し度",
    meaning: {
      1: "まだ早い",
      2: "慎重に見たい",
      3: "どちらでもない",
      4: "進めてよさそう",
      5: "強く推したい",
    } as Record<number, string>,
    section: {
      strengths: "強み",
      risks: "リスク",
      novelty: "新規性",
      nextMove: "次の一手",
    },
  },

  deleteConfirm: (title: string) => `「${title}」を削除します。この操作は取り消せません。`,

  errors: {
    required: "入力してください",
    tooLong: "長すぎます",
    notFound: "見つかりません",
    invalidStage: "段階が不正です",
    invalidReviewStatus: "見直し状態が不正です",
    outcomeTooLong: "結果が長すぎます",
    noteTooLong: "メモが長すぎます",
    scoreRange: "1から5で選んでください",
  },
};
