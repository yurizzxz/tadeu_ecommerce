import { test, expect } from "@playwright/test";

test("página inicial técnica", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DevStore" })).toBeVisible();
});
