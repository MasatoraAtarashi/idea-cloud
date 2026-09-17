import { redirect } from "react-router";
import { SETTINGS_PATH } from "../../lib/home-path";

export function loader() {
  return redirect(SETTINGS_PATH);
}

export default function TeamRedirect() {
  return null;
}
