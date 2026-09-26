import { redirect, type LoaderFunctionArgs } from "react-router";
import { LoginGate } from "../components/login-gate";
import { dictionary } from "../i18n/dictionary";
import { safeNextPath } from "../lib/next-path";
import type { Route } from "./+types/login";

/** Already signed in? The gate has nothing to offer — go straight to the app. */
export function loader({ context, request }: LoaderFunctionArgs) {
  if (context.userEmail) {
    const next = new URL(request.url).searchParams.get("next");
    throw redirect(safeNextPath(next, "/app"));
  }
  return { locale: context.locale };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").auth.metaTitle }];
}

export default function LoginPage() {
  return <LoginGate />;
}
