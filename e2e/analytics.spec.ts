import { expect, test } from "@playwright/test";
import { visible } from "./helpers";

test("analytics page renders idea counts without crashing", async ({ page }) => {
  await page.goto("/app/analytics");
  await expect(visible(page.getByRole("heading", { name: "アナリティクス" }))).toBeVisible();
  await expect(visible(page.getByText("アイデア総数")).first()).toBeVisible();
  await expect(visible(page.getByRole("heading", { name: "段階の分布" }))).toBeVisible();
  await expect(visible(page.getByRole("heading", { name: "1日あたりの着想" }))).toBeVisible();

  const week = visible(page.getByRole("button", { name: "7d" }));
  const month = visible(page.getByRole("button", { name: "30d" }));
  await expect(week).toHaveAttribute("aria-pressed", "true");
  await month.click();
  await expect(month).toHaveAttribute("aria-pressed", "true");
  await expect(week).toHaveAttribute("aria-pressed", "false");

  await expect(visible(page.getByRole("heading", { name: "よく出るタグ" }))).toBeVisible();
});
