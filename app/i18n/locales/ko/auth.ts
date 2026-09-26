import type { Dictionary } from "../../dictionary";

export const auth: Dictionary["auth"] = {
  cta: "Google로 계속하기",
  tagline: "떠오른 생각을 맡겨 두고, 묵혔다가, 익었을 때 다시 봅니다.",
  note: "조직 계정만 사용할 수 있습니다",
  metaTitle: "로그인 — 아이디어 클라우드",
  errors: {
    fallback: "로그인하지 못했습니다. 다시 시도해 주세요.",
    not_allowed: "이 계정은 허용되지 않았습니다. 관리자에게 문의하세요.",
    google_denied: "Google 쪽에서 로그인이 취소되었습니다.",
    invalid_request: "로그인 도중 정보가 유실되었습니다. 다시 시도해 주세요.",
    invalid_identity: "이메일 주소를 확인하지 못했습니다. 다른 계정으로 시도해 주세요.",
    exchange_failed: "Google과 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    oauth_unconfigured: "서버의 Google 설정이 완료되지 않았습니다.",
    server_misconfigured: "서버 설정이 완료되지 않았습니다.",
  },
};
