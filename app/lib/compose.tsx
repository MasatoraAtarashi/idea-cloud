import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** Compose copy lives in `t.compose`. */
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
