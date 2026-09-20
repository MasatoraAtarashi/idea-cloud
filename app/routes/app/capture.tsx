import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { useCompose, COMPOSE_TITLE } from "../../lib/compose";
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

export function loader({ request }: LoaderFunctionArgs) {
  return { mobileUa: isMobileUserAgent(request.headers.get("user-agent")) };
}

/** Deep link for compose. Desktop opens the list modal instead of a nav tab. */
export default function CapturePage() {
  const navigate = useNavigate();
  const { open } = useCompose();
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
    open();
    navigate(LIST_PATH, { replace: true });
  }, [mobileUa, navigate, open]);

  return <CaptureView autofocus />;
}
