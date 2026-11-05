import { expect, test } from "@playwright/test";

for (const width of [320, 1280]) {
  test(`catálogo e produto são utilizáveis em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/produtos");
    await expect(page.getByLabel("Buscar")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto("/produtos/ryzen-5-5600");
    await expect(page.getByRole("heading", { name: "Ryzen 5 5600" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entre para adicionar ao carrinho" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("busca no catálogo pode ser executada pelo teclado", async ({ page }) => {
  await page.goto("/produtos");
  const search = page.getByLabel("Buscar");
  for (let i = 0; i < 30 && !(await search.evaluate((element) => element === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(search).toBeFocused();
  await page.keyboard.type("Ryzen 5 5600");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=Ryzen/);
  await expect(page.getByRole("heading", { name: "Ryzen 5 5600" })).toBeVisible();
});
