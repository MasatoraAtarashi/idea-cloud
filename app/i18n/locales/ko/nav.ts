import type { Dictionary } from "../../dictionary";

export const nav: Dictionary["nav"] = {
  workspace: "워크스페이스",
  main: "메인",

  items: {
    ideas: "아이디어",
    inspirations: "영감",
    analytics: "분석",
    settings: "설정",
    ideasShort: "목록",
    inspirationsShort: "영감",
    analyticsShort: "분석",
  },

  savedViews: "저장한 뷰",
  viewName: "뷰 이름",
  saveCurrentFilters: "현재 조건 저장",

  reviewDueSuffix: "건 검토할 때",
  reviewDueBody: (days: number) => `${days}일 넘게 그대로입니다. 진행할지 접을지 정할 때예요.`,
  reviewDueAction: "검토하기",

  search: {
    trigger: "아이디어 검색",
    label: "검색",
    placeholder: "아이디어·댓글·영감·태그 검색",
    hint: "제목, 본문, 댓글, 영감, 태그를 한 번에 찾습니다.",
    loading: "검색 중…",
    empty: (query: string) => `‘${query}’ 결과가 없습니다`,
    moveHint: "↑↓ 이동",
    openHint: "⏎ 열기",
    create: "새 아이디어",
    createWith: (query: string) => `‘${query}’로 새 아이디어`,
    tagCount: (count: number) => `${count}건`,
    kinds: {
      all: "전체",
      idea: "아이디어",
      comment: "댓글",
      inspiration: "영감",
      tag: "태그",
    },
  },
};
