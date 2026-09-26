import { useId } from "react";
import { useLocation } from "react-router";
import { useLocale, useT } from "../i18n/context";
import { LOCALE_NAMES, LOCALES } from "../i18n/locale";

/**
 * Plain form post to `/lang`, so the choice survives without JS.
 *
 * The auto-submit is a tiny inline script rather than a React `onChange`: this
 * markup is server-rendered, and a React handler only exists once the page has
 * hydrated. Someone who reaches for the language straight away — the first
 * thing a visitor in the wrong language does — would otherwise change the
 * select and have nothing happen. The script is attached while the document
 * parses, so there is no dead window, and it is the only handler, so a change
 * never submits twice.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const location = useLocation();
  // The page can carry more than one switcher (header and footer), so each
  // needs ids of its own for the label and the script to point at.
  const selectId = useId();
  const formId = useId();
  const next = `${location.pathname}${location.search}`;

  return (
    <form
      id={formId}
      method="post"
      action="/lang"
      className={`flex items-center gap-1.5 ${className}`}
    >
      <input type="hidden" name="next" value={next} />
      <label htmlFor={selectId} className="sr-only">
        {t.common.language}
      </label>
      <select
        id={selectId}
        name="locale"
        data-testid="locale-switcher"
        defaultValue={locale}
        className="h-8 rounded-[8px] border border-border-control bg-card px-2 text-[12.5px] text-secondary"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {LOCALE_NAMES[value]}
          </option>
        ))}
      </select>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(function(){var f=document.getElementById(${JSON.stringify(
            formId,
          )});if(f){f.addEventListener("change",function(){f.requestSubmit()})}})()`,
        }}
      />
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
