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
    api: "API 키(MCP)",
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

  workspace: {
    label: "워크스페이스",
    members: {
      description:
        "이 워크스페이스의 아이디어와 인스피레이션은 모든 멤버가 보고 편집할 수 있습니다.",
      createInvite: "초대 링크 만들기",
      inviteLabel: "초대 링크({days}일 유효 · Google로 로그인한 누구나 참여 가능)",
      joined: "참여",
      self: "(나)",
      remove: "삭제",
      activeInvites: "유효한 초대 링크",
      inviteRow: "{role}로 참여 · {uses}/{max}회 사용 · {until}까지",
      revoke: "비활성화",
      inviteNote: "링크 본문은 저장되지 않아 다시 표시할 수 없습니다. 필요하면 새로 만드세요.",
      leaveTitle: "이 워크스페이스에서 나가기",
      leaveBody: "나가면 다른 워크스페이스로 전환됩니다. 마지막 관리자는 나갈 수 없습니다.",
      leave: "나가기",
      leaveConfirm: "이 워크스페이스에서 나가시겠습니까?",
    },
    general: {
      name: "워크스페이스 이름",
      ownerOnly: "이름 변경은 관리자만 할 수 있습니다.",
      saved: "저장했습니다.",
      mine: "참여 중인 워크스페이스",
      current: "현재",
      switch: "전환",
      createTitle: "새 워크스페이스 만들기",
      createPlaceholder: "팀 또는 프로젝트 이름",
      create: "만들기",
    },
    api: {
      title: "API 키(MCP)",
      description:
        "Cursor, Claude Desktop 등 에이전트가 /mcp에 연결할 때 쓰는 Authorization: Bearer입니다. 키는 이 워크스페이스의 데이터만 읽고 쓸 수 있습니다.",
      ownerOnly: "키 발급과 관리는 관리자만 할 수 있습니다.",
      namePlaceholder: "용도(예: Cursor)",
      nameLabel: "키 이름",
      issue: "발급",
      createdLabel: "새 키입니다. 지금만 표시되며 닫으면 다시 볼 수 없습니다.",
      none: "아직 키가 없습니다.",
      lastUsed: "최근 사용 {date}",
      unused: "미사용",
    },
    copy: "복사",
    copied: "복사됨",
    join: {
      metaTitle: "워크스페이스 참여 — Idea Cloud",
      eyebrow: "워크스페이스 초대",
      cannot: "참여할 수 없습니다",
      alreadyMember: "이미 이 워크스페이스의 멤버입니다. 전환해서 엽니다.",
      willJoin: "참여하면 이 워크스페이스의 아이디어와 인스피레이션을 보고 편집할 수 있습니다.",
      open: "열기",
      join: "참여하기",
      status: {
        missing: "이 초대 링크를 찾을 수 없습니다.",
        expired: "이 초대 링크는 만료되었습니다.",
        revoked: "이 초대 링크는 비활성화되었습니다.",
        exhausted: "이 초대 링크는 사용 횟수 상한에 도달했습니다.",
      },
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
