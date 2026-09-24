import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueLabel(prefix: string): string {
  return `${prefix}${Date.now()}`;
}

export function isMobileProject(projectName: string): boolean {
  return projectName === "mobile";
}

export function visible(locator: Locator): Locator {
  return locator.filter({ visible: true });
}

/** Where auth.setup.ts stores the signed-in session for the test projects. */
export const AUTH_STATE_PATH = "e2e/.auth/state.json";

/**
 * Real sign-in path. Locally GOOGLE_CLIENT_ID is unset, so /api/auth/google
 * signs in LOCAL_DEV_USER_EMAIL directly and sets the session cookie.
 */
export async function signIn(page: Page) {
  await page.goto("/login");
  await visible(page.getByRole("link", { name: "Google で続行" })).click();
  await page.waitForURL(/\/app/);
}

/** Starts at the login gate and follows it into the app. */
export async function continuePastLogin(page: Page) {
  await page.context().clearCookies();
  await signIn(page);
}

export async function expectListChrome(page: Page) {
  await expect(page).toHaveURL(/\/app\/list/);
}

export async function openIdeaFromList(page: Page, title: string, projectName: string) {
  await page.goto("/app/list");
  await expectListChrome(page);
  const link = page.locator('a[href^="/app/ideas/"]').filter({ hasText: title });
  const target = isMobileProject(projectName) ? link.first() : link.last();
  await expect(target).toBeVisible();
  const href = await target.getAttribute("href");
  expect(href, "idea list should link to detail").toBeTruthy();
  await page.goto(href!);
  await expect(page).toHaveURL(/\/app\/ideas\/\d+/);
}

async function openDesktopCompose(page: Page) {
  await page.goto("/app/list");
  await expectListChrome(page);
  const plus = visible(page.locator("header").getByRole("button", { name: "新規アイデア" }));
  await expect(plus).toBeVisible();
  const titleInput = page.locator("#idea-dialog-title");
  // SSR markup is clickable before React hydrates; retry until the dialog mounts.
  await expect(async () => {
    if (await titleInput.isVisible()) return;
    await plus.click({ trial: false });
    await expect(titleInput).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000, intervals: [300, 600, 1_000] });
}

/**
 * Create via the real chrome: mobile compose (`/app`) or desktop header +.
 * Tags are set so create-time auto-tag AI is skipped (no secrets in CI).
 * AI評価 is scheduled after insert and must not block this redirect.
 */
export async function createIdea(page: Page, projectName: string, title: string, body: string) {
  if (isMobileProject(projectName)) {
    await page.goto("/app");
    const submit = visible(page.getByRole("button", { name: "作成" }));
    await expect(submit).toBeVisible();
    const titleInput = page.locator("#idea-mobile-title");
    const bodyInput = page.locator("#idea-mobile");
    // Mobile compose is controlled. A fill that lands before hydration is
    // reset to empty state, which leaves 作成 disabled (Vite 8 hydrates later).
    await expect(async () => {
      await titleInput.fill(title);
      await bodyInput.fill(body);
      await expect(titleInput).toHaveValue(title);
      await expect(bodyInput).toHaveValue(body);
      await expect(submit).toBeEnabled();
    }).toPass({ timeout: 20_000 });
    await page.locator("#idea-mobile-tags").fill("e2e");
    await submit.click();
  } else {
    await openDesktopCompose(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("#idea-dialog-title").fill(title);
    await dialog.locator("#idea-dialog").fill(body);
    await dialog.locator('input[name="tags"]').fill("e2e");
    await dialog.getByRole("button", { name: "作成" }).click();
  }
  await expect(page).toHaveURL(/\/app\/list/, { timeout: 30_000 });
  await expect(
    visible(page.locator('a[href^="/app/ideas/"]').filter({ hasText: title })),
  ).toBeVisible();
}
