import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { COMPOSE_TITLE } from "../../lib/compose";
import { createIdeaAction } from "../../lib/idea-action";
import {
  isDesktopViewport,
  isMobileUserAgent,
  LIST_PATH,
  prefersComposeHome,
} from "../../lib/home-path";

export { createIdeaAction as action };

export function meta() {
  return [{ title: `${COMPOSE_TITLE} — アイデアクラウド` }];
}

/** Mobile UA stays on compose (スマホ=登録トップ) even before the viewport is known. */
export function loader({ request }: LoaderFunctionArgs) {
  return { mobileUa: isMobileUserAgent(request.headers.get("user-agent")) };
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
