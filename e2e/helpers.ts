import { expect, type Page } from "@playwright/test";

export function uniqueLabel(prefix: string): string {
  return `${prefix}${Date.now()}`;
}

export function isMobileProject(projectName: string): boolean {
  return projectName === "mobile";
}

/** Mock Google login — no OAuth. Mobile lands on compose; desktop on the list. */
export async function continuePastLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("link", { name: "Google で続行" }).click();
}

export async function expectListChrome(page: Page) {
  await expect(page).toHaveURL(/\/app\/list/);
  await expect(
    page.getByRole("heading", { name: "アイデア" }).or(page.getByText("絞り込み", { exact: true })),
  ).toBeVisible();
}

export async function openIdeaFromList(page: Page, title: string) {
  await page.goto("/app/list");
  await expectListChrome(page);
  await page.getByRole("link", { name: title }).first().click();
  await expect(page).toHaveURL(/\/app\/ideas\/\d+/);
}

export async function createIdea(page: Page, projectName: string, title: string, body: string) {
  if (isMobileProject(projectName)) {
    await continuePastLogin(page);
    await expect(page.getByText("新規アイデア").first()).toBeVisible();
    await page.getByLabel("タイトル").fill(title);
    await page.getByLabel("いま思いついたこと").fill(body);
    await page.getByRole("button", { name: "作成" }).click();
  } else {
    await continuePastLogin(page);
    await expectListChrome(page);
    await page.getByRole("button", { name: "新規アイデア" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("タイトル").fill(title);
    await dialog.getByLabel("いま思いついたこと").fill(body);
    await dialog.getByRole("button", { name: "作成" }).click();
  }
  await expectListChrome(page);
  await expect(page.getByText(title).first()).toBeVisible();
}
