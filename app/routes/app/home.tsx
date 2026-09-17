import { useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { COMPOSE_TITLE } from "../../lib/compose";
import { createIdeaAction } from "../../lib/idea-action";
import { isDesktopViewport, LIST_PATH } from "../../lib/home-path";

export { createIdeaAction as action };

export function meta() {
  return [{ title: `${COMPOSE_TITLE} — アイデアクラウド` }];
}

/**
 * `/app` is new-idea compose (mobile home). Desktop replaces to `/app/list`
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
