export const STAGES = ["spark", "aging", "ripe", "selected", "archived"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  spark: "着想",
  aging: "熟成中",
  ripe: "熟した",
  selected: "採用",
  archived: "アーカイブ",
};

export const STAGE_HINT: Record<Stage, string> = {
  spark: "捕まえたばかり。まだ触らない。",
  aging: "寝かせている。忘れてよい。",
  ripe: "見返す頃合い。進めるか、捨てる。",
  selected: "リサーチ / プロトタイプの対象。",
  archived: "記録として残す。表には出さない。",
};

export interface MockIdea {
  id: string;
  title: string;
  body: string;
  stage: Stage;
  tags: string[];
  author: string;
  team: string;
  createdAt: string;
  agedDays: number;
  relatedIds: string[];
}

export interface MockMember {
  name: string;
  email: string;
  role: "owner" | "member";
}

export const TEAM_NAME = "Atarashi Lab";

export const MEMBERS: MockMember[] = [
  { name: "新 正虎", email: "atarashi.masatora@gmail.com", role: "owner" },
  { name: "佐藤 めい", email: "mei@example.com", role: "member" },
  { name: "田中 海", email: "kai@example.com", role: "member" },
];

export const IDEAS: MockIdea[] = [
  {
    id: "i-voice-struct",
    title: "通勤の音声メモを、次の朝に構造化する",
    body: "歩きながら話した断片を、寝かせたあと見出しと次アクションに分ける。その場で整理しないのがポイント。",
    stage: "spark",
    tags: ["モバイル", "キャプチャ"],
    author: "新 正虎",
    team: TEAM_NAME,
    createdAt: "2026-09-16",
    agedDays: 0,
    relatedIds: ["i-friday-review"],
  },
  {
    id: "i-forget-well",
    title: "『よく忘れる』をチームの公式ルールにする",
    body: "投稿から14日は通知もリマインドもしない。熟成レーンに置いたアイデアは、触れないことが貢献。",
    stage: "aging",
    tags: ["チーム", "習慣"],
    author: "佐藤 めい",
    team: TEAM_NAME,
    createdAt: "2026-09-02",
    agedDays: 14,
    relatedIds: ["i-friday-review", "i-discard-ritual"],
  },
  {
    id: "i-cheap-tags",
    title: "Workers AI で安いタグ付けと関係抽出",
    body: "本文は暗号化して保持し、推論には最小限の抜粋だけ渡す。タグ・関連・進化案をバッチで付ける。",
    stage: "aging",
    tags: ["AI", "セキュリティ"],
    author: "田中 海",
    team: TEAM_NAME,
    createdAt: "2026-08-28",
    agedDays: 19,
    relatedIds: ["i-voice-struct", "i-research-gate"],
  },
  {
    id: "i-friday-review",
    title: "金曜の『熟した棚』レビュー",
    body: "熟したレーンだけを15分で見る。進める / 融合する / アーカイブ / 捨てるの四択。新規アイデアは開かない。",
    stage: "ripe",
    tags: ["レビュー", "チーム"],
    author: "新 正虎",
    team: TEAM_NAME,
    createdAt: "2026-08-01",
    agedDays: 46,
    relatedIds: ["i-forget-well", "i-discard-ritual"],
  },
  {
    id: "i-discard-ritual",
    title: "捨てる儀式を、採用より丁寧に",
    body: "捨てた理由を一行残す。後悔したら熟成レーンに戻せる。削除ではなく、手放しとして扱う。",
    stage: "ripe",
    tags: ["アーカイブ"],
    author: "佐藤 めい",
    team: TEAM_NAME,
    createdAt: "2026-07-20",
    agedDays: 58,
    relatedIds: ["i-friday-review"],
  },
  {
    id: "i-research-gate",
    title: "採用したアイデアだけリサーチする",
    body: "着想の段階では調べない。選ばれたものにだけ、競合・技術検証・小さなプロトタイプを付ける。",
    stage: "selected",
    tags: ["リサーチ", "プロトタイプ"],
    author: "新 正虎",
    team: TEAM_NAME,
    createdAt: "2026-06-12",
    agedDays: 96,
    relatedIds: ["i-cheap-tags"],
  },
  {
    id: "i-litellm-ui",
    title: "作業画面は LiteLLM のように静かに",
    body: "LiteLLM ダッシュボードの既定はライトモード。白パネル、薄いグレーボーダー、ネイビーの主ボタン。看板・詳細・融合を同じトーンで。モバイルは入力、デスクトップは判断。",
    stage: "selected",
    tags: ["UI"],
    author: "田中 海",
    team: TEAM_NAME,
    createdAt: "2026-06-04",
    agedDays: 104,
    relatedIds: ["i-research-gate"],
  },
  {
    id: "i-old-notebook",
    title: "紙のノートを全部デジタル化する（見送り）",
    body: "スキャンコストに対して、新しい着想の速度が落ちる。一度寝かせて、採用しなかった例。",
    stage: "archived",
    tags: ["見送り"],
    author: "新 正虎",
    team: TEAM_NAME,
    createdAt: "2026-03-02",
    agedDays: 198,
    relatedIds: [],
  },
];

export const APP_SCREENS = [
  { path: "/app/capture", title: "クイックキャプチャ", blurb: "思いつきを、整理せず置く。" },
  { path: "/app", title: "熟成ボード", blurb: "看板で熟成の段階を見る。" },
  { path: "/app/ideas/i-friday-review", title: "アイデア詳細", blurb: "本文・タグ・次の一手。" },
  { path: "/app/merge", title: "融合 / 関連", blurb: "近い着想をひとつに重ねる。" },
  { path: "/app/research", title: "リサーチ / プロトタイプ", blurb: "採用したものだけ深掘り。" },
  { path: "/app/team", title: "チーム設定", blurb: "許可リストと暗号化の方針。" },
] as const;

export function getIdea(id: string | undefined): MockIdea | undefined {
  if (!id) return undefined;
  return IDEAS.find((idea) => idea.id === id);
}

export function ideasByStage(stage: Stage): MockIdea[] {
  return IDEAS.filter((idea) => idea.stage === stage);
}
