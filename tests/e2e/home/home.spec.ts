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
  await page.getByRole("heading", { name: "Em destaque." }).scrollIntoViewIfNeeded();
  await expect(page.getByText("Imagem indisponível").first()).toBeVisible();
});

test("navega por teclado e abre a categoria escolhida", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
  await page.getByRole("link", { name: /Processadores/ }).click();
  await expect(page).toHaveURL(/category=processadores/);
  await expect(page.getByRole("heading", { name: "Ryzen 5 5600" })).toBeVisible();
});
