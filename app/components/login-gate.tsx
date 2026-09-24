import { useLayoutEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  GOOGLE_LOGIN_CTA,
  GOOGLE_LOGIN_NOTE,
  googleLoginHref,
  loginErrorMessage,
  LOGIN_TAGLINE,
} from "../auth/google-login";
import { homePathForClient, isDesktopViewport, NEW_IDEA_PATH } from "../lib/home-path";
import { BrandMark, BrandWordmark } from "./brand";

/** Official four-color G mark. Plain SVG — the flow runs on the Worker, not a Google SDK. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function LoginGate() {
  const [searchParams] = useSearchParams();
  // `next` is where the page gate sent the visitor from; otherwise pick the home
  // that matches this device (mobile = compose, desktop = list).
  const requestedNext = searchParams.get("next");
  const [continueTo, setContinueTo] = useState(requestedNext ?? NEW_IDEA_PATH);
  const errorMessage = loginErrorMessage(searchParams.get("error"));

  useLayoutEffect(() => {
    if (requestedNext) return;
    setContinueTo(
      homePathForClient({
        isDesktopViewport: isDesktopViewport(),
        userAgent: navigator.userAgent,
      }),
    );
  }, [requestedNext]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
        <BrandMark className="h-11 w-11" />
        <BrandWordmark className="ui-title mt-5 text-[22px]" />
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{LOGIN_TAGLINE}</p>
        {errorMessage ? (
          <p
            role="alert"
            className="mt-6 w-full rounded-[10px] border border-border-control bg-card px-3 py-2 text-[12.5px] leading-relaxed text-foreground"
          >
            {errorMessage}
          </p>
        ) : null}
        <a
          href={googleLoginHref(continueTo)}
          className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-[10px] border border-border-control bg-card text-[14px] font-semibold text-foreground no-underline hover:bg-row-hover"
        >
          <GoogleMark />
          {GOOGLE_LOGIN_CTA}
        </a>
        <p className="mt-4 text-[12.5px] text-muted-foreground">{GOOGLE_LOGIN_NOTE}</p>
      </div>
    </div>
  );
}
