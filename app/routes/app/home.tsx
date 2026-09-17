import { useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { IdeaListView } from "../../components/idea-list-view";
import { CAPTURE_PATH, isDesktopViewport } from "../../lib/home-path";

export function meta() {
  return [{ title: "アイデアクラウド" }];
}

/**
 * `/app` is desktop list home. On mobile it paints capture immediately, then
 * replaces to `/app/capture` so the 取る tab is active. Mobile 一覧 is `/app/list`.
 */
export default function AppHome() {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!isDesktopViewport()) {
      navigate(CAPTURE_PATH, { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <div className="md:hidden">
        <CaptureView />
      </div>
      <div className="hidden md:block">
        <IdeaListView />
      </div>
    </>
  );
}
