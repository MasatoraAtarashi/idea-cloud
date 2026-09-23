import { expect, test } from "@playwright/test";
import { createIdea, isMobileProject, openIdeaFromList, uniqueLabel, visible } from "./helpers";

test("creates an idea and shows it in the list", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E着想");
  await createIdea(page, testInfo.project.name, title, "通勤中にメモした種です。");
});

test("opens detail, edits title and body, and persists", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E編集前");
  await createIdea(page, testInfo.project.name, title, "編集前の本文");
  await openIdeaFromList(page, title, testInfo.project.name);
  await visible(page.locator("header").getByRole("button", { name: "編集" })).click();
  const nextTitle = `${title}改`;
  const nextBody = "編集後の本文です。";
  await page.locator("#idea-edit-title").fill(nextTitle);
  await page.locator("#idea-edit-body").fill(nextBody);
  await visible(page.getByRole("button", { name: "保存", exact: true })).click();
  await expect(visible(page.getByRole("heading", { name: nextTitle }))).toBeVisible();
  await expect(visible(page.getByText(nextBody))).toBeVisible();
  await page.reload();
  await expect(visible(page.getByRole("heading", { name: nextTitle }))).toBeVisible();
  await expect(visible(page.getByText(nextBody))).toBeVisible();
});

test("advances stage from detail", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E段階");
  await createIdea(page, testInfo.project.name, title, "段階を進めます。");
  await openIdeaFromList(page, title, testInfo.project.name);
  if (isMobileProject(testInfo.project.name)) {
    await visible(page.getByRole("button", { name: /次の段階へ/ })).click();
  } else {
    await page.getByLabel("段階").selectOption("aging");
  }
  await expect(visible(page.getByText("熟成中", { exact: true }))).toBeVisible();
});

test("adds a comment on detail", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E話");
  await createIdea(page, testInfo.project.name, title, "コメントを残します。");
  await openIdeaFromList(page, title, testInfo.project.name);
  await visible(page.getByRole("button", { name: /^コメント/ })).click();
  const note = uniqueLabel("E2Eコメント");
  await page.locator("#idea-comment").fill(note);
  await visible(page.getByRole("button", { name: "コメント送信" })).click();
  await expect(visible(page.getByText(note))).toBeVisible();
});

test("opens the discuss tab on idea detail", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E相談");
  const note = uniqueLabel("E2E質問");
  await createIdea(page, testInfo.project.name, title, "相談タブを開きます。");
  await openIdeaFromList(page, title, testInfo.project.name);
  await visible(page.getByRole("button", { name: "相談", exact: true })).click();
  await expect(visible(page.getByRole("heading", { name: "AIと話す" }))).toBeVisible();
  await expect(visible(page.getByRole("button", { name: "LPにするなら" }))).toBeVisible();
  await expect(visible(page.getByRole("button", { name: "法的リスクは？" }))).toBeVisible();
  await page.locator("#idea-discuss").fill(note);
  await visible(page.getByRole("button", { name: "送信", exact: true })).click();
  await expect(
    visible(page.getByText("相談の返信に失敗しました。時間をおいて再度お試しください。")),
  ).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await visible(page.getByRole("button", { name: "相談", exact: true })).click();
  await expect(visible(page.getByText(note))).toBeVisible();
});

test("research control is present and fails softly without paid APIs", async ({
  page,
}, testInfo) => {
  const title = uniqueLabel("E2E調査");
  await createIdea(page, testInfo.project.name, title, "リサーチ導線を確認します。");
  await openIdeaFromList(page, title, testInfo.project.name);
  await visible(page.getByRole("button", { name: "リサーチ", exact: true })).click();
  await expect(
    visible(
      page.getByText(
        "ウェブで先行事例を数件取得し、本文と合わせて分析します。検索に失敗してもメモは残します。",
        { exact: true },
      ),
    ),
  ).toBeVisible();
  await visible(page.getByRole("button", { name: "リサーチを実行" })).click();
  await expect(
    visible(page.getByText("リサーチに失敗しました。時間をおいて再度お試しください。")),
  ).toBeVisible({ timeout: 30_000 });
});
