import { expect, test } from "@playwright/test";
import { checkAccessibility } from "./axe";

for (const width of [320, 1280]) {
  test(`acessibilidade e SEO públicos em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/produtos", "/produtos/ryzen-5-5600", "/entrar", "/cadastro"]) {
      await page.goto(path);
      await checkAccessibility(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.locator("main h1")).toHaveCount(1);
      if (path === "/entrar" || path === "/cadastro") await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
    await page.goto("/produtos");
    await expect(page).toHaveTitle(/Produtos/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /componentes/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/produtos$/);
    await page.goto("/produtos?q=ryzen");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}
