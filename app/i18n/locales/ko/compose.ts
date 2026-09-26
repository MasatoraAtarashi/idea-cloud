import type { Dictionary } from "../../dictionary";

export const compose: Dictionary["compose"] = {
  title: "새 아이디어",
  metaTitle: "새 아이디어 — 아이디어 클라우드",
  shortcutHint: "새 아이디어 (⌘N)",

  heading: "새로운 아이디어",
  subheading: "다듬지 않아도 됩니다. 나중에 익힙니다.",
  titlePlaceholder: "제목",
  placeholder: "떠오른 그대로, 한마디.",

  submit: "만들기",
  submitWide: "아이디어 만들기",
  submitting: "만드는 중…",
  draftHint: "⌘Enter 로 만들기",

  tags: "태그",
  tagsPlaceholder: "태그 (비우면 자동)",
  tagHint: "비우면 자동",
  autoTagNote: "자동 태그에 실패해도 아이디어는 남습니다. 본문의 URL은 영감에도 남습니다.",
  urlHint: "본문의 URL은 영감에도 남습니다",

  category: {
    label: "카테고리",
    optional: "카테고리 (선택)",
    namePlaceholder: "카테고리 이름",
    add: "＋ 새 카테고리",
    cancel: "그만두기",
    none: "없음",
    newOption: "새 카테고리…",
  },
};
