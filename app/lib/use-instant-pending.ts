import { useEffect, useState } from "react";

/** Mark pending on the click tick so the UI doesn't wait for fetcher/navigation or Workers AI. */
export function useInstantPending(busy: boolean) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!busy) setHeld(false);
  }, [busy]);
  return {
    pending: held || busy,
    hold: () => setHeld(true),
  };
}
