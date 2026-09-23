import type { ReactNode } from "react";

/** Safe-area app bar for phone chrome. Desktop screens keep their own headers. */
export function MobileScreenHeader({
  leading,
  title,
  trailing,
  children,
}: {
  leading?: ReactNode;
  title?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
      <div className="flex min-h-11 items-center gap-1 px-3">
        {leading}
        {title ? <div className="min-w-0 flex-1">{title}</div> : <div className="min-w-0 flex-1" />}
        {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
      </div>
      {children}
    </header>
  );
}
