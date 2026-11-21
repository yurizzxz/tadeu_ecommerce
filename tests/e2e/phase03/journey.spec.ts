import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";
import { checkAccessibility } from "../a11y/axe";

config({ quiet: true });

for (const width of [320, 1280]) test(`jornada completa: cadastro até cancelamento em ${width}px`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width, height: 900 });
  async function verifyPrivatePage() {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await checkAccessibility(page);
  }
  async function activateByKeyboard(name: string) {
    const button = page.getByRole("button", { name, exact: true });
    for (let i = 0; i < 80 && !(await button.evaluate((element) => element === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    expect(await button.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await page.keyboard.press("Enter");
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const email = `jornada-${randomUUID()}@example.invalid`;
  const productId = randomUUID();
  const slug = `jornada-${productId}`;
  await db.connect();
  try {
    await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
      SELECT $1,c.id,b.id,$2,$2,$2,$2,1000,2,'https://placehold.co/800x800/png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [productId, slug]);
    await page.goto("/cadastro");
    await page.getByLabel("Nome").fill("Cliente jornada");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(`Senha-${randomUUID()}`);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
    await verifyPrivatePage();
    await page.getByRole("link", { name: "Editar perfil e endereço" }).click();
    await expect(page).toHaveURL(/\/perfil$/);
    await verifyPrivatePage();
    await page.getByLabel("CEP").fill("12345-678");
    await page.getByLabel("Rua", { exact: true }).fill("Rua de teste");
    await page.getByLabel("Número").fill("10");
    await page.getByLabel("Bairro").fill("Centro");
    await page.getByLabel("Cidade").fill("Cidade de teste");
    await page.getByLabel("UF").fill("SP");
    await page.getByRole("button", { name: "Cadastrar endereço" }).click();
    await expect(page.getByText("Rua de teste, 10")).toBeVisible();
    await page.goto(`/produtos/${slug}`);
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("status")).toContainText("Carrinho atualizado");
    await page.goto("/carrinho");
    await verifyPrivatePage();
    await expect(page.getByText("Total: R$ 10,00", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Revisar pedido" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await verifyPrivatePage();
    await expect(page.getByText("Rua de teste, 10")).toBeVisible();
    await activateByKeyboard("Finalizar pedido");
    await expect(page.getByRole("status").filter({ hasText: "Pedido finalizado" })).toBeVisible();
    const order = await db.query('SELECT o.id, p.stock FROM public.orders o JOIN public.users u ON u.id = o.user_id JOIN public.order_items i ON i.order_id = o.id JOIN public.products p ON p.id = i.product_id WHERE u.email = $1', [email]);
    expect(order.rowCount).toBe(1);
    expect(order.rows[0].stock).toBe(1);
    await page.goto("/pedidos");
    await verifyPrivatePage();
    await page.getByRole("link", { name: new RegExp(order.rows[0].id) }).click();
    await expect(page).toHaveURL(new RegExp(`/pedidos/${order.rows[0].id}$`));
    await verifyPrivatePage();
    await activateByKeyboard("Cancelar pedido");
    await activateByKeyboard("Confirmar cancelamento");
    await expect(page.getByText("Cancelado", { exact: false }).first()).toBeVisible();
    const result = await db.query('SELECT o.status, p.stock FROM public.orders o JOIN public.order_items i ON i.order_id = o.id JOIN public.products p ON p.id = i.product_id WHERE o.id = $1', [order.rows[0].id]);
    expect(result.rows[0]).toMatchObject({ status: "CANCELLED", stock: 2 });
  } finally {
    await db.query('DELETE FROM public.orders WHERE user_id IN (SELECT id FROM public.users WHERE email = $1)', [email]);
    await db.query('DELETE FROM public.users WHERE email = $1', [email]);
    await db.query('DELETE FROM public.products WHERE id = $1', [productId]);
    await db.end();
    await new Promise((resolve) => setTimeout(resolve, 10250));
  }
});
