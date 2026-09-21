import { expect, test } from "@playwright/test";

test("analytics page renders idea counts without crashing", async ({ page }) => {
  await page.goto("/app/analytics");
  await expect(page.getByRole("heading", { name: "アナリティクス" })).toBeVisible();
  await expect(page.getByText("アイデア").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "日別の作成" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7日" })).toBeVisible();
  await expect(page.getByRole("button", { name: "30日" })).toBeVisible();
  await page.getByRole("button", { name: "30日" }).click();
  await expect(page.getByText(/30日間で/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "段階" })).toBeVisible();
});
