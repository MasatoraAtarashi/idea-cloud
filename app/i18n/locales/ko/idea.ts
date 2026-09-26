import type { Dictionary } from "../../dictionary";

export const idea: Dictionary["idea"] = {
  metaTitle: "아이디어 — 아이디어 클라우드",
  heading: "아이디어",
  empty: "아직 없습니다",
  listLink: "목록",
  backToList: "목록으로 돌아가기",
  editButton: "편집",
  aiTab: "AI 작업대",
  agedDaysShort: (days) => `${days}d`,
  noAutoTags: "자동 태그 없음",

  nextStage: "다음 단계로",
  nextStageTo: (stage) => `다음 단계로(${stage})`,
  nextStageArchived: "보관 중에는 넘길 수 없습니다",
  nextStageLast: "마지막 단계입니다",
  updating: "갱신 중…",
  moreActions: "다른 작업",
  changeStage: "단계 변경",
  mergeWithOther: "다른 아이디어와 융합",
  archive: "보관",
  untitled: "제목 없음",

  selfReview: {
    heading: "내 평가와 회고",
    open: "열기",
    score: (score) => `내 점수 ${score}`,
    hasReflection: "회고 있음",
  },

  merge: {
    metaTitle: "융합 — 아이디어 클라우드",
    heading: "융합",
    detail: "상세",
    selected: (count) => `${count}건 선택`,
    submit: "융합하기",
    hint: "두 건 이상 고르면 겹친 한 문장이 여기에 나옵니다.",
    result: (titles) => `${titles} 을(를) 하나로 겹칩니다.`,
  },

  edit: {
    title: "제목",
    body: "본문",
    tags: "태그",
    tagsPlaceholder: "쉼표로 구분",
    category: "카테고리",
    stage: "단계",
    saving: "저장 중…",
  },

  comments: {
    heading: "댓글",
    empty: "아직 댓글이 없습니다. 나중에 조금씩 남길 수 있습니다.",
    placeholder: "나중에 알아차린 것을 적기",
    sendLabel: "댓글 보내기",
    addAs: (name) => `${name}(으)로 추가(⌘Enter)`,
    send: "보내기",
    sending: "보내는 중…",
  },

  actions: {
    menuLabel: "작업",
    delete: "삭제",
    deleting: "삭제 중…",
  },

  copy: {
    label: "복사",
    aria: "설명까지 복사",
    result: "복사 결과",
    ok: "복사했습니다",
    fail: "복사하지 못했습니다",
    stageField: "단계",
    categoryField: "카테고리",
    tagsField: "태그",
  },

  swipe: {
    ai: "AI",
    merge: "융합",
  },

  score: {
    heading: "평가",
    hint: "1–5 점수. 짧은 메모는 선택입니다.",
    noteLabel: "평가 메모",
    notePlaceholder: "짧은 메모(선택)",
    human: (score) => `나${score}`,
    ai: (score) => `AI${score}`,
  },

  review: {
    heading: "다시 보기",
    hint: "묵힌 뒤, 진행할지 잠시 멈출지 정합니다.",
    current: (status) => ` 지금은 ${status}.`,
    reviewed: "다시 봤다",
    hold: "보류",
    discard: "버리기",
    discardPrompt: "보관해서 선반에서 내릴지, 완전히 삭제할지 고를 수 있습니다.",
    rested: (days) => `${days}일 묵혔습니다. 지금 다시 읽으면 어떤가요?`,
    archive: "보관하기",
    delete: "삭제하기",
    cancel: "그만두기",
  },

  reflection: {
    heading: "회고",
    hint: "해본 뒤의 결과만 남깁니다. AI에는 아직 쓰지 않습니다.",
    outcomeLabel: "해본 결과",
    outcomePlaceholder: "해본 결과",
    notesLabel: "회고 메모",
    notesPlaceholder: "메모(선택)",
    submit: "회고 저장",
    saving: "저장 중…",
    status: {
      none: "미기입",
      tried: "해봤다",
      hold: "보류",
      dropped: "그만뒀다",
    },
  },

  tabs: {
    discuss: "상담",
    evaluate: "평가",
    research: "리서치",
    brainstorm: "브레스트",
  },

  evaluation: {
    scoreLabel: "추천도",
    meaning: {
      1: "아직 이르다",
      2: "신중하게 보고 싶다",
      3: "어느 쪽도 아니다",
      4: "진행해도 좋겠다",
      5: "강하게 밀고 싶다",
    },
    section: {
      strengths: "강점",
      risks: "리스크",
      novelty: "새로움",
      nextMove: "다음 한 수",
    },
  },

  deleteConfirm: (title) => `「${title}」을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,

  errors: {
    required: "입력해 주세요",
    tooLong: "너무 깁니다",
    notFound: "찾을 수 없습니다",
    invalidStage: "단계가 올바르지 않습니다",
    invalidReviewStatus: "다시 보기 상태가 올바르지 않습니다",
    outcomeTooLong: "결과가 너무 깁니다",
    noteTooLong: "메모가 너무 깁니다",
    scoreRange: "1에서 5 사이로 선택해 주세요",
  },
};
