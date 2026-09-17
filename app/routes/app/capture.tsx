import { CaptureView } from "../../components/capture-view";
import { createIdeaAction } from "../../lib/idea-action";

export { createIdeaAction as action };

export function meta() {
  return [{ title: "キャプチャ — アイデアクラウド" }];
}

export default function CapturePage() {
  return <CaptureView autofocus />;
}
