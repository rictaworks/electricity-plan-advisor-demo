import { test, expect } from "@playwright/test";

test.describe("結果画面", () => {
  test("sessionStorageなしでアクセスするとトップにリダイレクト", async ({ page }) => {
    await page.goto("/result");
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
