import { useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { isDesktopViewport, LIST_PATH } from "../../lib/home-path";

export function meta() {
  return [{ title: "キャプチャ — アイデアクラウド" }];
}

/**
 * `/app` is capture-only (mobile home). Desktop replaces to `/app/list`
 * so a phone never gets the shrunk list/filter chrome.
 */
export default function AppHome() {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (isDesktopViewport()) {
      navigate(LIST_PATH, { replace: true });
    }
  }, [navigate]);

  return <CaptureView autofocus />;
}
