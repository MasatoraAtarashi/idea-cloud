import type { Dictionary } from "../../dictionary";

export const settings: Dictionary["settings"] = {
  metaTitle: "설정 — 아이디어 클라우드",
  title: "설정",

  groups: {
    workspace: "워크스페이스",
    personal: "개인",
  },
  sections: {
    members: "멤버와 접근 권한",
    general: "일반",
    team: "팀",
    stages: "단계와 라벨",
    profile: "프로필",
    notify: "알림과 숙성 리마인드",
    shortcuts: "단축키",
  },
  stub: "아직 없습니다.",

  language: {
    title: "언어",
    description: "화면에 표시할 언어를 바꿉니다.",
  },

  members: {
    description: "아이디어를 보고 고칠 수 있는 범위는 팀 단위로 정해집니다.",
    invite: "멤버 초대",
    inviteDisabled: "연결 전",
    columns: {
      member: "멤버",
      role: "권한",
      lastSeen: "최근 접속",
    },
    roles: {
      owner: "관리자",
      member: "멤버",
    },
    online: "로그인 중",
    visibility: {
      heading: "기본 공개 범위",
      team: { title: "팀 전체", body: "같은 팀의 모두가 보고 고칠 수 있음" },
      author: { title: "작성자만", body: "공유하기 전까지는 본인만 볼 수 있음" },
      workspace: { title: "워크스페이스 전체", body: "모든 팀에서 찾아볼 수 있음" },
      note: "표시만 됩니다. 아직 저장되지 않습니다.",
    },
  },

  profile: {
    account: "로그인한 Google 계정",
    unknown: "알 수 없음",
    note: "이름과 사진은 Google 설정을 따릅니다. 결제는 Stripe 페이지에서 끝납니다.",
  },

  billing: {
    plan: "플랜",
    premium: "프리미엄 (AI 기능 포함)",
    free: "프리 (AI 기능 없음)",
    comped: "관리자가 부여해 결제가 없습니다.",
    canceledPrefix: "이용 가능 기한",
    renewsPrefix: "다음 갱신",
    pastDueSuffix: " (결제 재시도 중)",
    upgrade: "프리미엄으로",
    manage: "결제 수단·해지",
  },

  dateLocale: "ko-KR",
};
