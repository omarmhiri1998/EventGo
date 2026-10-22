import { test, expect } from "@playwright/test";

test.describe("EventGo - Authentication Protection", () => {
  test("redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);
  });

  test("does not allow unauthenticated access to checkout", async ({ page }) => {
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);
  });
});