import { useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { CaptureView } from "../../components/capture-view";
import { IdeaListView } from "../../components/idea-list-view";
import { homePath, isDesktopViewport } from "../../lib/home-path";

export function meta() {
  return [{ title: "アイデアクラウド" }];
}

/** `/app` home: CSS shows the right surface immediately, then the URL matches nav. */
export default function AppHome() {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    navigate(homePath(isDesktopViewport()), { replace: true });
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
