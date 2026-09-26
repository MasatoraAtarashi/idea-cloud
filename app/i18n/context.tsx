import { createContext, useContext, type ReactNode } from "react";
import { dictionary, type Dictionary } from "./dictionary";
import { DEFAULT_LOCALE, type Locale } from "./locale";

type I18n = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: dictionary(DEFAULT_LOCALE),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Copy for the current locale. `const t = useT(); t.nav.ideas`. */
export function useT(): Dictionary {
  return useContext(I18nContext).t;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
