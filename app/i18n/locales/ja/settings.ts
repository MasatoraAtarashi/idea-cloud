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
    api: "API キー（MCP）",
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

  /** ワークスペース（テナント）関連。docs/spec/workspaces.md */
  workspace: {
    label: "ワークスペース",
    members: {
      description:
        "このワークスペースのアイデアとインスピレーションは、メンバー全員が閲覧・編集できます。",
      createInvite: "招待リンクを作る",
      inviteLabel: "招待リンク（{days}日間有効・Google でログインした人が参加できます）",
      joined: "参加",
      self: "（自分）",
      remove: "削除",
      activeInvites: "有効な招待リンク",
      inviteRow: "{role}として参加 · {uses}/{max} 回使用 · {until} まで",
      revoke: "無効化",
      inviteNote:
        "リンクの本文は保存していないため、再表示はできません。必要なら作り直してください。",
      leaveTitle: "このワークスペースから離脱",
      leaveBody: "離脱後は別のワークスペースに切り替わります。最後の管理者は離脱できません。",
      leave: "離脱する",
      leaveConfirm: "このワークスペースから離脱しますか？",
    },
    general: {
      name: "ワークスペース名",
      ownerOnly: "名前の変更は管理者のみできます。",
      saved: "保存しました。",
      mine: "参加しているワークスペース",
      current: "現在",
      switch: "切り替え",
      createTitle: "新しいワークスペースを作る",
      createPlaceholder: "チーム名やプロジェクト名",
      create: "作成",
    },
    api: {
      title: "API キー（MCP）",
      description:
        "Cursor や Claude Desktop などのエージェントが /mcp へ接続するときの Authorization: Bearer です。キーはこのワークスペースのデータだけを読み書きできます。",
      ownerOnly: "キーの発行と管理は管理者のみできます。",
      namePlaceholder: "用途（例: Cursor）",
      nameLabel: "キーの名前",
      issue: "発行",
      createdLabel: "新しいキー。今だけ表示されます。閉じると二度と見られません。",
      none: "まだキーはありません。",
      lastUsed: "最終使用 {date}",
      unused: "未使用",
    },
    copy: "コピー",
    copied: "コピー済み",
    join: {
      metaTitle: "ワークスペースに参加 — アイデアクラウド",
      eyebrow: "ワークスペースへの招待",
      cannot: "参加できません",
      alreadyMember: "すでにこのワークスペースのメンバーです。切り替えて開きます。",
      willJoin:
        "参加すると、このワークスペースのアイデアとインスピレーションを閲覧・編集できます。",
      open: "開く",
      join: "参加する",
      status: {
        missing: "この招待リンクは見つかりません。",
        expired: "この招待リンクは期限切れです。",
        revoked: "この招待リンクは無効化されています。",
        exhausted: "この招待リンクは使用回数の上限に達しました。",
      },
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
