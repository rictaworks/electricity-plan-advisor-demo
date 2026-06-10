import { test, expect } from "@playwright/test";

test.describe("入力フロー", () => {
  test("トップページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /電力プラン自動提案/ })).toBeVisible();
  });

  test("家族構成フォームが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("家族構成")).toBeVisible();
    await expect(page.getByText("月別電力使用量")).toBeVisible();
  });

  test("送信ボタンが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /最安プランを見つける/ })).toBeVisible();
  });
});
