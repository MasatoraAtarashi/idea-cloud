import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { dictionary } from "../../i18n/dictionary";
import { createIdeaAction } from "../../lib/idea-action";
import {
  isDesktopViewport,
  isMobileUserAgent,
  LIST_PATH,
  prefersComposeHome,
} from "../../lib/home-path";
import type { Route } from "./+types/home";

export { createIdeaAction as action };

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").compose.metaTitle }];
}

/** Mobile UA stays on compose (スマホ=登録トップ) even before the viewport is known. */
export function loader({ context, request }: LoaderFunctionArgs) {
  return {
    mobileUa: isMobileUserAgent(request.headers.get("user-agent")),
    locale: context.locale,
  };
}

/**
 * `/app` is new-idea compose (mobile home). Desktop replaces to `/app/list`
 * so a phone never gets the shrunk list/filter chrome.
 */
export default function AppHome() {
  const navigate = useNavigate();
  const { mobileUa } = useLoaderData<typeof loader>();

  useLayoutEffect(() => {
    if (
      prefersComposeHome({
        isDesktopViewport: isDesktopViewport(),
        userAgent: mobileUa ? "Mobile" : navigator.userAgent,
      })
    ) {
      return;
    }
    navigate(LIST_PATH, { replace: true });
  }, [mobileUa, navigate]);

  return <CaptureView autofocus />;
}
