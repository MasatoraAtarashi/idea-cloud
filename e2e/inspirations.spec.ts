import { expect, test } from "@playwright/test";
import { isMobileProject, uniqueLabel } from "./helpers";

test("adds an inspiration memo and shows it on the shelf", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E棚");
  const memo = "あとでアイデアにするメモ";
  await page.goto("/app/inspirations");
  await expect(page.getByRole("heading", { name: "インスピレーション" })).toBeVisible();

  if (isMobileProject(testInfo.project.name)) {
    const compose = page.getByRole("heading", { name: "メモを残す" });
    if (!(await compose.isVisible())) {
      await page.getByRole("button", { name: "インスピレーションを追加" }).click();
    }
    await expect(compose).toBeVisible();
  }

  await page.getByLabel("タイトル").fill(title);
  await page.getByLabel("メモ").fill(memo);
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page).toHaveURL(/\/app\/inspirations\/\d+/);
  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText(memo)).toBeVisible();

  await page.goto("/app/inspirations");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
