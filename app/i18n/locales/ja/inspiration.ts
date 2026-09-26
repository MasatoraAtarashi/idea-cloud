export const inspiration = {
  metaTitle: "インスピレーション — アイデアクラウド",
  title: "インスピレーション",

  /** Placeholder title for a card with nothing to show. Also the stored fallback. */
  untitled: "無題",

  pasteUrl: "URLを貼る",
  pasteHint: "URLだけでも追加できます。プレビューが取れなくても保存されます。",
  urlLabel: "URL",
  titleLabel: "タイトル（任意）",
  titlePlaceholder: "タイトル（空でも可）",
  urlPlaceholder: "http:// または https://",
  memoLabel: "メモ",
  memoPlaceholder: "残したいこと",
  tagsLabel: "タグ",
  tagsPlaceholder: "タグ（任意・読点区切り）",
  add: "追加",

  noTags: "まだタグがありません",
  clearFilter: "絞り込みを外す",

  emptyTitle: "まだインスピレーションがありません",
  emptyBody: "URL かメモを残して、あとでアイデアにします。",
  makeIdea: "アイデアにする",
  fetchFailedShort: "取得できず",

  notFound: "まだありません",
  toShelf: "棚へ",
  edit: "編集",
  delete: "削除",
  deleting: "削除中…",
  noMemo: "メモはまだありません",
  refetch: "再取得",
  refetching: "取得中…",
  previewFailed: "プレビューを取得できませんでした。再取得できます。",
  deleteConfirm: (title: string) => `「${title}」を削除します。この操作は取り消せません。`,
  /** Mono line under the detail body. */
  timestamps: (created: string, updated: string) => `created ${created} · updated ${updated}`,
  /** Reference line appended to the idea body made from a card. */
  reference: (url: string) => `参考: ${url}`,

  dialog: {
    title: "インスピレーションからアイデアを作る",
    viewSource: "元ネタを見る",
    fieldTitle: "タイトル",
    fieldBody: "本文",
    fieldCategory: "カテゴリ",
    tags: "タグ",
    removeTag: (tag: string) => `${tag}を外す`,
    remove: "外す",
    tagPlaceholder: "空なら自動で付きます",
    autoTags: "元ページから自動抽出",
    footerNote: "作成後はこのインスピが紐づきます",
    brainstormAndCreate: "AIブレストしてから作る",
    brainstorming: "ブレスト中…",
    create: "作成",
  },

  errors: {
    empty: "入力してください",
    tooLong: "長すぎます",
    notFound: "見つかりません",
    noUrl: "URLがありません",
    urlFormat: "URLの形式が正しくありません",
    urlProtocol: "http または https のURLにしてください",
    titleTooLong: "タイトルが長すぎます",
    memoTooLong: "メモが長すぎます",
    urlTooLong: "URLが長すぎます",
  },
};
