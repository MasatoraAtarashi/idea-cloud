import type { Dictionary } from "../../dictionary";

export const list: Dictionary["list"] = {
  metaTitle: "아이디어 — 아이디어 클라우드",
  title: "아이디어",
  count: (n: number) => `${n}개`,

  layout: {
    table: "목록",
    board: "보드",
  },

  tabsLabel: "아이디어 필터 탭",
  tab: {
    all: "전체",
    "aging-shelf": "숙성 중",
    candidates: "돌아볼 때",
    tried: "실행함",
  },
  tabShort: {
    all: "전체",
    "aging-shelf": "숙성",
    candidates: "돌아보기",
    tried: "실행",
  },

  clearFilters: "조건 지우기",
  filters: "필터",
  search: "검색",
  sortOrder: "정렬",

  candidateBanner: (n: number) => `돌아볼 아이디어 ${n}개`,
  candidateBannerAction: "보기",

  column: {
    stage: "단계",
    idea: "아이디어",
    tags: "태그",
    aiScore: "추천도",
    comments: "댓글",
    aged: "숙성",
    updated: "수정",
  },
  aiScoreFull: "AI 추천도",
  sortByLabel: (label: string) => `${label} 기준 정렬`,
  filterByLabel: (label: string) => `${label} 기준 필터`,

  keyword: "키워드",
  keywordPlaceholderShort: "제목·본문·태그",
  keywordPlaceholder: "제목·본문·태그로 좁히기",
  category: "카테고리",
  allOption: "전체",
  noTags: "아직 태그가 없습니다",
  agedDays: "숙성 일수",
  agedDaysAtLeast: (n: number) => `${n}일 이상`,
  agedDaysMin: "최소 숙성 일수",
  agedDaysMinPlaceholder: "일 이상",

  groupHint: {
    aging: "재우는 중. 건드리지 않아도 됩니다.",
    ripe: "다시 읽어볼 때. 진행할지 정합니다.",
    spark: "막 붙잡은 것. 다듬지 않습니다.",
    selected: "실행하기로 한 것.",
    archived: "지금은 움직이지 않습니다.",
  },

  sort: {
    key: {
      updatedAt: "수정",
      createdAt: "작성",
      stage: "단계",
      title: "제목",
    },
    asc: " 오름차순",
    desc: " 내림차순",
  },

  boardEmpty: "아직 없습니다",

  swipe: {
    next: "다음 단계로",
    archive: "보관",
    updating: "업데이트 중…",
  },

  meta: {
    aiScore: (score: number) => `추천도 ${score}`,
    comments: (n: number) => `댓글 ${n}`,
  },

  savedViews: {
    label: "뷰",
    fallbackName: "뷰",
    custom: "사용자 지정",
    allIdeas: "모든 아이디어",
    empty: "저장된 뷰가 없습니다",
    delete: "삭제",
    deleteLabel: (name: string) => `${name} 삭제`,
    nameLabel: "뷰 이름",
    namePlaceholder: "현재 조건 저장",
    save: "뷰 저장",
    hint: "단계·태그·숙성 일수·검색을 이름 붙여 남길 수 있습니다.",
    errorNameRequired: "이름을 입력하세요",
    errorNameTooLong: "이름이 너무 깁니다",
    errorTooMany: "뷰가 너무 많습니다",
    errorNotFound: "찾을 수 없습니다",
    errorBadIntent: "잘못된 요청입니다",
  },

  empty: {
    title: "아직 아이디어가 없습니다",
    body: "떠오른 순간의 거친 상태를 그대로 둡니다. 맡겨서 재우고, 익을 무렵 다시 봅니다.",
    create: "첫 아이디어 만들기",
  },

  reviewStatus: {
    none: "안 봄",
    hold: "보류",
    reviewed: "다시 봄",
  },

  date: (y: string, m: string, d: string) => `${y}/${m}/${d}`,

  days: (n: number) => `${n}일`,

  relative: {
    now: "방금",
    minutesAgo: (n: number) => `${n}분 전`,
    hoursAgo: (n: number) => `${n}시간 전`,
    yesterday: "어제",
    daysAgo: (n: number) => `${n}일 전`,
    lastWeek: "지난주",
    weeksAgo: (n: number) => `${n}주 전`,
  },

  compact: {
    now: "now",
    minutes: (n: number) => `${n}m`,
    hours: (n: number) => `${n}h`,
    days: (n: number) => `${n}d`,
    weeks: (n: number) => `${n}w`,
  },
};
