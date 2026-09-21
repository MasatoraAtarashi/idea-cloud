import { expect, test } from "@playwright/test";
import { visible } from "./helpers";

test("analytics page renders idea counts without crashing", async ({ page }) => {
  await page.goto("/app/analytics");
  await expect(visible(page.getByRole("heading", { name: "アナリティクス" }))).toBeVisible();
  await expect(visible(page.getByText("アイデア")).first()).toBeVisible();
  await expect(visible(page.getByRole("heading", { name: "日別の作成" }))).toBeVisible();
  await expect(visible(page.getByRole("button", { name: "7日" }))).toBeVisible();
  await expect(visible(page.getByRole("button", { name: "30日" }))).toBeVisible();
  await visible(page.getByRole("button", { name: "30日" })).click();
  await expect(visible(page.getByText(/30日間で/))).toBeVisible();
  await expect(visible(page.getByRole("heading", { name: "段階" }))).toBeVisible();
});
