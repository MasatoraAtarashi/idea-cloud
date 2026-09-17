import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export const COMPOSE_TITLE = "新規アイデア";
export const COMPOSE_SUBMIT = "作成";
export const COMPOSE_PLACEHOLDER = "いま思いついたこと";

type ComposeContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

export function useCompose(): ComposeContextValue {
  const value = useContext(ComposeContext);
  if (!value) {
    throw new Error("useCompose must be used within ComposeProvider");
  }
  return value;
}
