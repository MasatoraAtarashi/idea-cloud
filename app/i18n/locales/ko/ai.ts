import type { Dictionary } from "../../dictionary";

export const ai: Dictionary["ai"] = {
  workbench: {
    title: "AI 작업대",
    presetLabel: "프리셋",
    running: "실행 중",
  },

  preset: {
    fast: "빠르고 저렴",
    standard: "표준",
    deep: "꼼꼼히",
  },

  archive: {
    research: "보관한 아이디어는 리서치할 수 없습니다",
    brainstorm: "보관한 아이디어는 브레인스토밍할 수 없습니다",
    evaluate: "보관한 아이디어는 AI 평가할 수 없습니다",
    discuss: "보관한 아이디어는 상담할 수 없습니다",
  },

  /** Bad or unknown idea id in an AI action. */
  notFound: "찾을 수 없습니다",

  menu: {
    actions: "메뉴",
  },

  research: {
    run: "리서치 실행",
    rerun: "다시 리서치",
    running: "실행 중…",
    hint: "웹에서 비슷한 사례를 몇 건 찾아 본문과 함께 분석합니다.",
    sourcesHeading: "비슷한 사례",
    webSearchUnavailable: "웹 검색 결과 없음",
    latest: "최근 리서치",
    comment: "AI 코멘트",
    notRun: "아직 실행하지 않았습니다.",
    emptyArchived: "리서치 메모가 없습니다. 보관한 아이디어는 리서치할 수 없습니다",
  },

  brainstorm: {
    run: "브레인스토밍",
    running: "실행 중…",
    hint: "관점, 다른 안, 다음 질문을 넓혀 줍니다. 실행할 때마다 남습니다.",
    latest: "최근",
    previous: "이전",
    notRun: "아직 실행하지 않았습니다.",
    emptyArchived: "아직 없습니다. 보관한 아이디어는 브레인스토밍할 수 없습니다",
  },

  evaluate: {
    run: "AI 평가",
    rerun: "다시 평가",
    running: "평가 중…",
    hint: (scoreLabel: string) =>
      `강점, 리스크, 새로움, 다음 수와 1–5의 ${scoreLabel}. 가장 최근 것만 남습니다.`,
    notScored: "아직 평가하지 않았습니다",
    inProgress: "evaluating…",
    fullTitle: "평가 전문",
    noBody: "본문이 없습니다.",
    notRun: "아직 평가하지 않았습니다.",
    emptyArchived: "평가가 없습니다. 보관한 아이디어는 AI 평가할 수 없습니다",
  },

  discuss: {
    link: "AI와 이야기하기",
    intro:
      "이 아이디어에 대해 물어볼 수 있습니다. 법적 판단은 하지 않습니다. 아래 질문으로 시작해 보세요.",
    saved: "상담은 저장됩니다",
    inputLabel: "AI에게 질문",
    placeholder: "이 아이디어에 대해 묻기",
    send: "보내기",
    sending: "보내는 중…",
    starters: [
      { label: "랜딩페이지로 만든다면", body: "이걸 랜딩페이지로 만든다면 어떤 느낌이 좋을까?" },
      { label: "법적 리스크는?", body: "이거 법적 리스크는 없을까?" },
      { label: "다음 수는?", body: "다음 수는?" },
      { label: "경쟁사와의 차별화", body: "경쟁사와의 차별화는?" },
    ],
  },

  premium: {
    title: "프리미엄 전용",
    body: "AI 작업대(상담·평가·리서치·브레인스토밍)와 자동 태그는 프리미엄 플랜 기능입니다.",
    cta: "프리미엄으로 전환",
    opening: "여는 중…",
    note: "결제는 Stripe 페이지에서 끝납니다. 아이디어 작성·편집·댓글은 계속 무료입니다.",
  },

  billing: {
    notReady: "결제는 준비 중입니다.",
    failed: "결제 페이지를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },

  page: {
    metaTitle: "리서치 — 아이디어 클라우드",
    title: "리서치",
    empty: "아직 없습니다",
    selectLabel: "채택한 아이디어",
    openDetail: "상세 열기",
    tabResearch: "리서치",
    tabProto: "프로토타입",
    noNotes: "리서치 메모가 없습니다.",
    protoNote: "작은 실험 절차는 채택한 뒤에 씁니다.",
  },
};
