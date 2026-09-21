import { expect, test } from "@playwright/test";
import { continuePastLogin, isMobileProject, visible } from "./helpers";

test("mobile tabs reach 一覧, インスピレーション, and 分析", async ({ page }, testInfo) => {
  test.skip(!isMobileProject(testInfo.project.name), "Bottom tabs are phone chrome.");
  await continuePastLogin(page);
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(visible(page.getByRole("button", { name: "作成" }))).toBeVisible();
  await expect(visible(page.getByText("新規アイデア"))).toBeVisible();

  await visible(page.getByRole("link", { name: "閉じる" })).click();
  await expect(page).toHaveURL(/\/app\/list/);
  await expect(visible(page.getByRole("navigation", { name: "メイン" }))).toBeVisible();
  await expect(visible(page.getByText("絞り込み"))).toBeVisible();

  await visible(page.getByRole("link", { name: "インスピレーション" })).click();
  await expect(page).toHaveURL(/\/app\/inspirations/);
  await expect(visible(page.getByRole("heading", { name: "インスピレーション" }))).toBeVisible();

  await visible(page.getByRole("link", { name: "アナリティクス" })).click();
  await expect(page).toHaveURL(/\/app\/analytics/);
  await expect(visible(page.getByRole("heading", { name: "アナリティクス" }))).toBeVisible();

  await visible(page.getByRole("link", { name: "一覧", exact: true })).click();
  await expect(page).toHaveURL(/\/app\/list/);
});

test("desktop stays list-first after login", async ({ page }, testInfo) => {
  test.skip(isMobileProject(testInfo.project.name), "Desktop home is the idea list.");
  await continuePastLogin(page);
  await expect(page).toHaveURL(/\/app\/list/);
  await expect(visible(page.getByRole("heading", { name: "アイデア" }))).toBeVisible();
  await expect(visible(page.getByRole("link", { name: "インスピレーション" }))).toBeVisible();
  await expect(visible(page.getByRole("link", { name: "アナリティクス" }))).toBeVisible();
});
