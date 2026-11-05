import { expect, test } from "@playwright/test";

for (const width of [320, 1280]) {
  test(`home exibe categorias e produtos em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Seu próximo upgrade começa aqui/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Encontre por categoria." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Em destaque." })).toBeVisible();
    await expect(page.getByRole("link", { name: /Explorar produtos/ })).toHaveAttribute("href", "/produtos");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("apresenta fallback quando uma imagem falha", async ({ page }) => {
  await page.route("**/_next/image?**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("Imagem indisponível").first()).toBeVisible();
});
