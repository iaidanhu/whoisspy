import { expect, test } from "@playwright/test";

test.describe("locale shell", () => {
  test("root redirects to default locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/zh(\/|$)/);
  });

  test("zh start page loads", async ({ page }) => {
    await page.goto("/zh/start");
    await expect(page.locator("body")).toBeVisible();
  });
});
