import type { Dictionary } from "../../dictionary";

export const auth: Dictionary["auth"] = {
  cta: "Continue with Google",
  tagline: "Park a thought, let it rest, come back when it has ripened.",
  note: "Organization accounts only",
  metaTitle: "Sign in — Idea Cloud",
  errors: {
    fallback: "We could not sign you in. Please try again.",
    not_allowed: "This account is not on the allowlist. Contact your administrator.",
    google_denied: "Sign-in was cancelled on Google's side.",
    invalid_request: "Some information was lost during sign-in. Please try again.",
    invalid_identity: "We could not verify your email address. Try another account.",
    exchange_failed: "We could not reach Google. Please try again in a moment.",
    oauth_unconfigured: "Google sign-in is not configured on the server.",
    server_misconfigured: "The server is not fully configured.",
  },
};
