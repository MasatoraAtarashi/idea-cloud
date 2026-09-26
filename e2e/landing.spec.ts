import { expect, test } from "@playwright/test";
import { signIn, visible } from "./helpers";

/**
 * The public front door. Every project in this config carries a signed-in
 * storage state, so each test clears cookies first to look like a visitor.
 */
test.describe("landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("greets a signed-out visitor in Japanese and offers sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(visible(page.getByRole("link", { name: "無料ではじめる" }).first())).toBeVisible();
  });

  test("switches language and remembers it on the next page", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("locale-switcher").first().selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      visible(page.getByRole("link", { name: "Get started free" }).first()),
    ).toBeVisible();

    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(visible(page.getByRole("link", { name: "Continue with Google" }))).toBeVisible();
  });

  test("sends a signed-in visitor straight into the app", async ({ page }) => {
    await signIn(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/app/);
  });
});
