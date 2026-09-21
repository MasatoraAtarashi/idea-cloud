import { expect, test } from "@playwright/test";
import { createIdea, isMobileProject, openIdeaFromList, uniqueLabel } from "./helpers";

test("creates an idea and shows it in the list", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E着想");
  await createIdea(page, testInfo.project.name, title, "通勤中にメモした種です。");
});

test("opens detail, edits title and body, and persists", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E編集前");
  await createIdea(page, testInfo.project.name, title, "編集前の本文");
  await openIdeaFromList(page, title);
  await page.getByRole("button", { name: "編集" }).first().click();
  const nextTitle = `${title}改`;
  const nextBody = "編集後の本文です。";
  await page.getByLabel("タイトル").fill(nextTitle);
  await page.getByLabel("本文").fill(nextBody);
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("heading", { name: nextTitle })).toBeVisible();
  await expect(page.getByText(nextBody)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: nextTitle })).toBeVisible();
  await expect(page.getByText(nextBody)).toBeVisible();
});

test("advances stage from detail", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E段階");
  await createIdea(page, testInfo.project.name, title, "段階を進めます。");
  await openIdeaFromList(page, title);
  if (isMobileProject(testInfo.project.name)) {
    await page.getByRole("button", { name: /次の段階へ/ }).click();
  } else {
    await page.getByLabel("段階").selectOption("aging");
  }
  await expect(page.getByText("熟成中").first()).toBeVisible();
});

test("adds a comment on detail", async ({ page }, testInfo) => {
  const title = uniqueLabel("E2E話");
  await createIdea(page, testInfo.project.name, title, "コメントを残します。");
  await openIdeaFromList(page, title);
  await page.getByRole("button", { name: /^コメント/ }).click();
  const note = uniqueLabel("E2Eコメント");
  await page.getByLabel("コメント").fill(note);
  await page.getByRole("button", { name: "コメント送信" }).click();
  await expect(page.getByText(note)).toBeVisible();
});

test("research control is present and fails softly without paid APIs", async ({
  page,
}, testInfo) => {
  const title = uniqueLabel("E2E調査");
  await createIdea(page, testInfo.project.name, title, "リサーチ導線を確認します。");
  await openIdeaFromList(page, title);
  await page.getByRole("button", { name: "リサーチ", exact: true }).click();
  await expect(page.getByText("このリサーチはモデルのみです")).toBeVisible();
  await page.getByRole("button", { name: "リサーチを実行" }).click();
  await expect(
    page.getByText("リサーチに失敗しました。時間をおいて再度お試しください。"),
  ).toBeVisible({ timeout: 30_000 });
});
