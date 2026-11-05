import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";
config({ quiet: true });

test("busca e combina filtros mantendo a URL compartilhável", async ({ page }) => {
  await page.goto("/produtos");
  await page.getByLabel("Buscar").fill("MEMÓRIA");
  await page.getByLabel("Categoria").selectOption("memorias");
  await page.getByLabel("Somente disponíveis").check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/category=memorias/);
  await expect(page.getByRole("heading", { name: "Memória DDR4 16 GB" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SSD NVMe 1 TB" })).toHaveCount(0);
  const url = page.url();
  await page.goto(url);
  await expect(page.getByLabel("Buscar")).toHaveValue("MEMÓRIA");
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(/\/produtos$/);
});

test("parâmetros inválidos não quebram o catálogo", async ({ page }) => {
  await page.goto("/produtos?minPrice=inválido&category=...&available=sim");
  await expect(page.getByRole("heading", { name: "Encontre sua próxima peça." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Memória DDR4 16 GB" })).toBeVisible();
});

test("combina marca e faixa de preço", async ({ page }) => {
  await page.goto("/produtos?brand=amd&minPrice=700&maxPrice=900");
  await expect(page.getByRole("heading", { name: "Ryzen 5 5600" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core i5-12400F" })).toHaveCount(0);
});

test("produto sem estoque aparece e é removido pelo filtro de disponibilidade", async ({ page }) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const id = randomUUID();
  const slug = `teste-indisponivel-${id}`;
  try {
    await db.connect();
    await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
      SELECT $1,c.id,b.id,$2,$3,$3,$2,100,0,'https://placehold.co/800x800/png','{}',true,now()
      FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [id, `Produto indisponível ${id}`, slug]);
    await page.goto(`/produtos?q=${id}`);
    await expect(page.getByText("Indisponível", { exact: true })).toBeVisible();
    await page.getByLabel("Somente disponíveis").check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("Nenhum produto encontrado.")).toBeVisible();
    await page.goto(`/produtos/${slug}`);
    await expect(page.getByRole("button", { name: "Produto indisponível" })).toBeDisabled();
  } finally {
    await db.query("DELETE FROM public.products WHERE id = $1 AND slug = $2", [id, slug]);
    await db.end();
  }
});
