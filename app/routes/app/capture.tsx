import { useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { useCompose, COMPOSE_TITLE } from "../../lib/compose";
import { createIdeaAction } from "../../lib/idea-action";
import { isDesktopViewport, LIST_PATH } from "../../lib/home-path";

export { createIdeaAction as action };

export function meta() {
  return [{ title: `${COMPOSE_TITLE} — アイデアクラウド` }];
}

/** Deep link for compose. Desktop opens the list modal instead of a nav tab. */
export default function CapturePage() {
  const navigate = useNavigate();
  const { open } = useCompose();

  useLayoutEffect(() => {
    if (isDesktopViewport()) {
      open();
      navigate(LIST_PATH, { replace: true });
    }
  }, [navigate, open]);

  return <CaptureView autofocus />;
}
