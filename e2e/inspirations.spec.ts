import { expect, test } from "@playwright/test";
import { isMobileProject, uniqueLabel, visible } from "./helpers";

test("adds an inspiration memo and shows it on the shelf", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E棚");
  const memo = "あとでアイデアにするメモ";
  await page.goto("/app/inspirations");
  await expect(visible(page.getByRole("heading", { name: "インスピレーション" }))).toBeVisible();

  if (isMobileProject(testInfo.project.name)) {
    const compose = visible(page.getByRole("heading", { name: "メモを残す" }));
    if (!(await compose.isVisible())) {
      await visible(page.getByRole("button", { name: "インスピレーションを追加" })).click();
    }
    await expect(compose).toBeVisible();
  }

  await page.locator("#inspiration-title").fill(title);
  await page.locator("#inspiration-memo").fill(memo);
  await page.getByRole("button", { name: "追加", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/inspirations\/\d+/);
  await expect(visible(page.getByText(title))).toBeVisible();
  await expect(visible(page.getByText(memo))).toBeVisible();

  await page.goto("/app/inspirations");
  await expect(visible(page.getByRole("link", { name: title }))).toBeVisible();
});
