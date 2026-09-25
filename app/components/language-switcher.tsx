import { useLocation } from "react-router";
import { useLocale, useT } from "../i18n/context";
import { LOCALE_NAMES, LOCALES } from "../i18n/locale";

/**
 * Plain form post to `/lang`, so the choice survives without JS. With JS the
 * select submits itself and the fallback button stays hidden in `<noscript>`.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const location = useLocation();
  const next = `${location.pathname}${location.search}`;

  return (
    <form method="post" action="/lang" className={`flex items-center gap-1.5 ${className}`}>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="locale-switcher" className="sr-only">
        {t.common.language}
      </label>
      <select
        id="locale-switcher"
        name="locale"
        defaultValue={locale}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-[8px] border border-border-control bg-card px-2 text-[12.5px] text-secondary"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {LOCALE_NAMES[value]}
          </option>
        ))}
      </select>
      <noscript>
        <button
          type="submit"
          className="h-8 rounded-[8px] border border-border-control bg-card px-2 text-[12.5px]"
        >
          OK
        </button>
      </noscript>
    </form>
  );
}
