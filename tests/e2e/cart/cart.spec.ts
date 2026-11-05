import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

test("carrinho persiste, isola usuários e respeita estoque em adições simultâneas", async ({ browser }) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  const emails = contexts.map(() => `carrinho-${randomUUID()}@example.invalid`);
  const passwords = contexts.map(() => `Senha-${randomUUID()}`);
  const productId = randomUUID();
  const inactiveId = randomUUID();
  const suffix = randomUUID();
  const slug = `carrinho-teste-${suffix}`;
  try {
    await db.connect();
    await db.query(`INSERT INTO public.products (id, category_id, brand_id, name, slug, sku, description, price_in_cents, stock, image_url, specifications, is_active, updated_at)
      SELECT $1,c.id,b.id,$2,$3,$3,$2,1000,2,'https://placehold.co/800x800/png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [productId, `Produto ${suffix}`, slug]);
    await db.query(`INSERT INTO public.products (id, category_id, brand_id, name, slug, sku, description, price_in_cents, stock, image_url, specifications, is_active, updated_at)
      SELECT $1,c.id,b.id,$2,$3,$3,$2,1000,2,'https://placehold.co/800x800/png','{}',false,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [inactiveId, `Inativo ${suffix}`, `inativo-${suffix}`]);
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    await pages[0].goto("/carrinho");
    await expect(pages[0]).toHaveURL(/\/entrar$/);
    for (let i = 0; i < pages.length; i++) {
      await pages[i].goto("/cadastro");
      await pages[i].getByLabel("Nome").fill(`Cliente ${i}`);
      await pages[i].getByLabel("E-mail").fill(emails[i]);
      await pages[i].getByLabel("Senha").fill(passwords[i]);
      await pages[i].getByRole("button", { name: "Criar conta" }).click();
      await expect(pages[i].getByRole("heading", { name: "Minha conta" })).toBeVisible();
      await pages[i].goto(`/produtos/${slug}`);
    }
    const extra = await contexts[0].newPage();
    await extra.goto(`/produtos/${slug}`);
    await Promise.all([pages[0], extra].map((page) => page.getByRole("button", { name: "Adicionar ao carrinho" }).click()));
    await Promise.all([pages[0], extra].map((page) => expect(page.getByRole("status")).toContainText("Carrinho atualizado")));
    await pages[0].getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "Quantidade acima do estoque" })).toBeVisible();
    await pages[1].getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(pages[1].getByRole("status")).toContainText("Carrinho atualizado");
    await pages[0].goto("/carrinho");
    await expect(pages[0].getByLabel("Quantidade")).toHaveValue("2");
    await expect(pages[0].getByText("Total: R$ 20,00", { exact: true })).toBeVisible();
    await pages[0].getByLabel("Quantidade").fill("1");
    await pages[0].getByRole("button", { name: "Atualizar" }).click();
    await expect(pages[0].getByText("Total: R$ 10,00", { exact: true })).toBeVisible();
    await pages[0].goto("/conta");
    await pages[0].getByRole("button", { name: "Sair" }).click();
    await pages[0].getByLabel("E-mail").fill(emails[0]);
    await pages[0].getByLabel("Senha").fill(passwords[0]);
    await pages[0].getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(pages[0].getByRole("heading", { name: "Minha conta" })).toBeVisible();
    await pages[0].goto("/carrinho");
    await expect(pages[0].getByLabel("Quantidade")).toHaveValue("1");
    await pages[1].goto("/carrinho");
    const otherItem = await db.query('SELECT ci.id FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id JOIN public.users u ON u.id = c.user_id WHERE u.email = $1', [emails[1]]);
    expect(otherItem.rowCount).toBe(1);
    await pages[0].locator('input[name="itemId"]').first().evaluate((input: HTMLInputElement, id: string) => { input.value = id; }, otherItem.rows[0].id);
    await pages[0].getByLabel("Quantidade").fill("2");
    await pages[0].getByRole("button", { name: "Atualizar" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "Item não encontrado" })).toBeVisible();
    await pages[1].reload();
    await expect(pages[1].getByLabel("Quantidade")).toHaveValue("1");
    await pages[0].goto(`/produtos/${slug}`);
    await pages[0].locator('input[name="productId"]').evaluate((input: HTMLInputElement, id: string) => { input.value = id; }, inactiveId);
    await pages[0].getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "Produto indisponível" })).toBeVisible();
    await db.query("UPDATE public.products SET stock = 0 WHERE id = $1", [productId]);
    await pages[0].locator('input[name="productId"]').evaluate((input: HTMLInputElement, id: string) => { input.value = id; }, productId);
    await pages[0].getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "Produto indisponível" })).toBeVisible();
    await pages[0].reload();
    await expect(pages[0].getByRole("button", { name: "Produto indisponível" })).toBeDisabled();
    await pages[0].goto("/carrinho");
    await expect(pages[0].getByText("Produto indisponível")).toBeVisible();
    await pages[0].getByRole("button", { name: "Remover" }).click();
    await expect(pages[0].getByText("Seu carrinho está vazio.")).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await db.query('DELETE FROM public.users WHERE email = ANY($1::text[])', [emails]);
    await db.query('DELETE FROM public.products WHERE id = ANY($1::uuid[])', [[productId, inactiveId]]);
    await db.end();
  }
});
