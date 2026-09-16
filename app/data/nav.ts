export interface NavItem {
  to: string;
  label: string;
  short: string;
  end: boolean;
}

export interface NavGroup {
  label: string;
  items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "ワークスペース",
    items: [
      { to: "/app/capture", label: "キャプチャ", short: "取る", end: false },
      { to: "/app", label: "アイデア", short: "一覧", end: true },
      { to: "/app/merge", label: "融合", short: "融合", end: false },
      { to: "/app/research", label: "リサーチ", short: "研究", end: false },
    ],
  },
  {
    label: "設定",
    items: [{ to: "/app/team", label: "チーム", short: "設定", end: false }],
  },
];

export const NAV: readonly NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items]);
