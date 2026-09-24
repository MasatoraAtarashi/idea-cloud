import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, signIn } from "./helpers";

/**
 * Signs in once and saves the session cookie for every project.
 * Locally no Google client is configured, so /api/auth/google signs in
 * LOCAL_DEV_USER_EMAIL directly (see docs/spec/oauth-swap.md).
 */
setup("sign in", async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/app/);
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
