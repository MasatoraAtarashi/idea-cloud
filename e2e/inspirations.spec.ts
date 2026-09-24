import { expect, test } from "@playwright/test";
import { openInspirationCompose, uniqueLabel, visible } from "./helpers";

test("adds an inspiration memo and shows it on the shelf", async ({ page }) => {
  const title = uniqueLabel("E2E棚");
  const memo = "あとでアイデアにするメモ";
  await page.goto("/app/inspirations");
  await expect(visible(page.getByRole("heading", { name: "インスピレーション" }))).toBeVisible();
  await openInspirationCompose(page);

  await page.locator("#inspiration-title").fill(title);
  await page.locator("#inspiration-memo").fill(memo);
  await page.getByRole("button", { name: "追加", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/inspirations\/\d+/);
  await expect(visible(page.getByText(title))).toBeVisible();
  await expect(visible(page.getByText(memo))).toBeVisible();

  await page.goto("/app/inspirations");
  await expect(visible(page.getByRole("link", { name: title })).first()).toBeVisible();
});

test("saves a pasted http URL without a title", async ({ page }) => {
  const url = "http://www.sc-runner.com/2013/10/kinovea-tutorial.html";
  await page.goto("/app/inspirations");
  await openInspirationCompose(page);

  const urlInput = page.locator("#inspiration-url");
  await expect(urlInput).toHaveAttribute("type", "text");
  await expect(urlInput).toHaveAttribute("inputmode", "url");
  await urlInput.evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, ` \n${url}\n `);
  await page.getByRole("button", { name: "追加", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/inspirations\/\d+/);
  await expect(visible(page.getByRole("link", { name: url }))).toBeVisible();
  await expect(page.getByText("URLの形式が正しくありません")).toHaveCount(0);
});
