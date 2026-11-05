import { test, expect } from "@playwright/test";

test("página inicial técnica", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
