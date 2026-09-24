import { redirect, type LoaderFunctionArgs } from "react-router";
import { LoginGate } from "../components/login-gate";
import { safeNextPath } from "../lib/next-path";

/** Already signed in? The gate has nothing to offer — go straight to the app. */
export function loader({ context, request }: LoaderFunctionArgs) {
  if (!context.userEmail) return null;
  const next = new URL(request.url).searchParams.get("next");
  throw redirect(safeNextPath(next, "/app"));
}

export function meta() {
  return [{ title: "ログイン — アイデアクラウド" }];
}

export default function HomeLoginPage() {
  return <LoginGate />;
}
