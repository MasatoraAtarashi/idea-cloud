import { LoginGate } from "../components/login-gate";

export function meta() {
  return [{ title: "ログイン — アイデアクラウド" }];
}

export default function LoginPage() {
  return <LoginGate />;
}
