import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { useCompose } from "../../lib/compose";
import { dictionary } from "../../i18n/dictionary";
import { createIdeaAction } from "../../lib/idea-action";
import {
  isDesktopViewport,
  isMobileUserAgent,
  LIST_PATH,
  prefersComposeHome,
} from "../../lib/home-path";
import type { Route } from "./+types/capture";

export { createIdeaAction as action };

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").compose.metaTitle }];
}

export function loader({ context, request }: LoaderFunctionArgs) {
  return {
    mobileUa: isMobileUserAgent(request.headers.get("user-agent")),
    locale: context.locale,
  };
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
