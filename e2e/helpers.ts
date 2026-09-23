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

/** Mock Google login — no OAuth. Mobile lands on compose; desktop on the list. */
export async function continuePastLogin(page: Page) {
  await page.goto("/login");
  await visible(page.getByRole("link", { name: "Google で続行" })).click();
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
 */
export async function createIdea(page: Page, projectName: string, title: string, body: string) {
  if (isMobileProject(projectName)) {
    await page.goto("/app");
    await expect(visible(page.getByRole("button", { name: "作成" }))).toBeVisible();
    await page.locator("#idea-mobile-title").fill(title);
    await page.locator("#idea-mobile").fill(body);
    await page.locator("#idea-mobile-tags").fill("e2e");
    await visible(page.getByRole("button", { name: "作成" })).click();
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
