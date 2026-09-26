import { redirect, type ActionFunctionArgs } from "react-router";
import { DEFAULT_LOCALE, isLocale, localeCookieHeader } from "../i18n/locale";
import { safeNextPath } from "../lib/next-path";

/**
 * Resource route behind the language switcher. POST so a prefetch or a crawler
 * can never change someone's language; the cookie then outranks Accept-Language.
 */
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const requested = form.get("locale");
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  const next = safeNextPath(
    typeof form.get("next") === "string" ? (form.get("next") as string) : null,
    "/",
  );
  return redirect(next, { headers: { "set-cookie": localeCookieHeader(locale) } });
}

/** Nothing to render: a stray GET just goes home. */
export function loader() {
  return redirect("/");
}
