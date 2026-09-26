export const settings = {
  metaTitle: "設定 — アイデアクラウド",
  title: "設定",

  groups: {
    workspace: "ワークスペース",
    personal: "個人",
  },
  sections: {
    members: "メンバーとアクセス",
    general: "一般",
    team: "チーム",
    stages: "段階とラベル",
    profile: "プロフィール",
    notify: "通知と熟成リマインド",
    shortcuts: "ショートカット",
  },
  /** Placeholder body for the sections that are not wired up yet. */
  stub: "まだありません。",

  language: {
    title: "言語",
    description: "画面の表示言語を切り替えます。",
  },

  members: {
    description: "アイデアの閲覧・編集範囲はチーム単位で決まります。",
    invite: "メンバーを招待",
    inviteDisabled: "未配線",
    columns: {
      member: "メンバー",
      role: "権限",
      lastSeen: "最終アクセス",
    },
    roles: {
      owner: "管理者",
      member: "メンバー",
    },
    online: "ログイン中",
    visibility: {
      heading: "既定の公開範囲",
      team: { title: "チーム全体", body: "同じチームの全員が閲覧・編集できる" },
      author: { title: "起案者のみ", body: "共有するまで本人だけに見える" },
      workspace: { title: "ワークスペース全体", body: "全チームから横断で参照できる" },
      note: "表示のみ。保存はまだありません。",
    },
  },

  profile: {
    account: "ログイン中の Google アカウント",
    unknown: "不明",
    note: "名前とアイコンは Google の設定に従います。支払いは Stripe のページで完結します。",
  },

  billing: {
    plan: "プラン",
    premium: "プレミアム（AI機能あり）",
    free: "フリー（AI機能なし）",
    comped: "管理者による付与のため、支払いはありません。",
    canceledPrefix: "利用できるのは",
    renewsPrefix: "次回更新",
    pastDueSuffix: "（支払いを再試行中）",
    upgrade: "プレミアムにする",
    manage: "支払い方法・解約",
  },

  /** `toLocaleDateString` tag for the billing period end. */
  dateLocale: "ja-JP",
};
