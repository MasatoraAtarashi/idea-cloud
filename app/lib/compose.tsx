import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export const COMPOSE_TITLE = "新規アイデア";
export const COMPOSE_SUBMIT = "作成";
export const COMPOSE_PLACEHOLDER = "思いついたまま、ひとこと。";
export const COMPOSE_HEADING = "新しいアイデア";
export const COMPOSE_SUBHEADING = "整えなくていい。あとで熟成させます。";
export const COMPOSE_TAG_HINT = "空なら自動で付きます";
export const COMPOSE_TITLE_PLACEHOLDER = "タイトル";
export const COMPOSE_DRAFT_HINT = "⌘Enter で作成";
export const COMPOSE_URL_HINT = "本文のURLはインスピレーションにも残します";

type ComposeContextValue = {
  isOpen: boolean;
  /** Title to prefill on the next open (⌘⏎ from the search palette). */
  seedTitle: string;
  open: () => void;
  openWithTitle: (title: string) => void;
  close: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [seedTitle, setSeedTitle] = useState("");
  const open = useCallback(() => {
    setSeedTitle("");
    setOpen(true);
  }, []);
  const openWithTitle = useCallback((title: string) => {
    setSeedTitle(title);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, seedTitle, open, openWithTitle, close }),
    [isOpen, seedTitle, open, openWithTitle, close],
  );
  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

export function useCompose(): ComposeContextValue {
  const value = useContext(ComposeContext);
  if (!value) {
    throw new Error("useCompose must be used within ComposeProvider");
  }
  return value;
}
