import { expect, test } from "@playwright/test";
import { createIdea, isMobileProject, uniqueLabel, visible } from "./helpers";

/**
 * Clicking a row opens a quick-look drawer instead of leaving the list; the
 * detail page is still one click further in, for the work that needs room.
 */
test.describe("quick peek drawer", () => {
  test("opens from a row, stays on the list, and closes back to it", async ({ page }, testInfo) => {
    const title = uniqueLabel("peek-");
    await createIdea(page, testInfo.project.name, title, "寝かせて熟すためのアイデア。");

    const row = visible(page.locator('a[href^="/app/ideas/"]').filter({ hasText: title }));
    const href = await row.first().getAttribute("href");
    await row.first().click();

    // Still the list — the drawer is a layer, not a page.
    await expect(page).toHaveURL(/\/app\/list/);
    await expect(page).toHaveURL(new RegExp(`peek=${href!.split("/").pop()}`));
    const drawer = page.getByRole("dialog", { name: title });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "詳細を開く" })).toHaveAttribute("href", href!);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page).not.toHaveURL(/peek=/);
    // A keyboard reader lands back on the row, not at the top of the page.
    await expect(
      visible(page.locator('a[href^="/app/ideas/"]').filter({ hasText: title })),
    ).toBeFocused();
  });

  test("reopens on reload and carries the reader into the detail page", async ({
    page,
  }, testInfo) => {
    const title = uniqueLabel("peek-reload-");
    await createIdea(page, testInfo.project.name, title, "リロードしても開いたまま。");

    const row = visible(page.locator('a[href^="/app/ideas/"]').filter({ hasText: title })).first();
    const href = await row.getAttribute("href");
    await row.click();

    const drawer = page.getByRole("dialog", { name: title });
    await expect(drawer).toBeVisible();
    await page.reload();
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();

    await page
      .getByRole("dialog", { name: title })
      .getByRole("link", { name: "詳細を開く" })
      .click();
    await expect(page).toHaveURL(new RegExp(`${href!}$`));
  });

  test("walks to the neighbouring idea without closing", async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), "no hardware keyboard on the phone project");
    const first = uniqueLabel("peek-a-");
    const second = uniqueLabel("peek-b-");
    await createIdea(page, testInfo.project.name, first, "1件目。");
    await createIdea(page, testInfo.project.name, second, "2件目。");

    await visible(page.locator('a[href^="/app/ideas/"]').filter({ hasText: second }))
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: second })).toBeVisible();

    await page.keyboard.press("ArrowDown");
    // Whichever way the list is ordered, ↓ must land on a different idea and
    // leave the drawer open rather than closing it.
    await expect(page.getByRole("dialog", { name: second })).toBeHidden();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/peek=/);
  });
});
