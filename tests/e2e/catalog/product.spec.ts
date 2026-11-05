import { expect, test } from "@playwright/test";

test("visitante abre produto e encontra chamada para entrar", async ({ page }) => {
  await page.goto("/");
  await page.locator(".product-card").first().click();
  await expect(page).toHaveURL(/\/produtos\//);
  await page.goto("/produtos/ryzen-5-5600");
  await expect(page.getByRole("heading", { name: "Ryzen 5 5600" })).toBeVisible();
  await expect(page.getByText("SKU: CPU-AMD-5600")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Especificações" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entre para adicionar ao carrinho" })).toHaveAttribute("href", "/entrar");
  await expect(page).toHaveTitle(/Ryzen 5 5600/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/produtos\/ryzen-5-5600$/);
});

test("produto ausente retorna 404 e filtros não são indexáveis", async ({ page }) => {
  const response = await page.goto("/produtos/produto-inexistente");
  expect(response?.status()).toBe(404);
  await page.goto("/produtos?q=memoria");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/entrar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
