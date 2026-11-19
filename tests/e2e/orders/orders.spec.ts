import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

test.afterEach(async () => { await new Promise((resolve) => setTimeout(resolve, 10250)); });

test("histórico isola pedidos e cancelamento repõe estoque apenas uma vez", async ({ browser }) => {
  test.setTimeout(90000);
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  const emails = contexts.map(() => `pedidos-${randomUUID()}@example.invalid`);
  const productId = randomUUID();
  const orderId = randomUUID();
  const expiredId = randomUUID();
  const timezoneId = randomUUID();
  try {
    await db.connect();
    const pages = await Promise.all(contexts.map(context => context.newPage()));
    await pages[0].goto("/pedidos");
    await expect(pages[0]).toHaveURL(/\/entrar$/);
    for (let i = 0; i < pages.length; i++) {
      await pages[i].goto("/cadastro");
      await pages[i].getByLabel("Nome").fill(`Cliente ${i}`);
      await pages[i].getByLabel("E-mail").fill(emails[i]);
      await pages[i].getByLabel("Senha").fill(`Senha-${randomUUID()}`);
      await pages[i].getByRole("button", { name: "Criar conta" }).click();
      await expect(pages[i].getByRole("heading", { name: "Minha conta" })).toBeVisible();
    }
    const userId = (await db.query('SELECT id FROM public.users WHERE email = $1', [emails[0]])).rows[0].id;
    await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
      SELECT $1,c.id,b.id,$2,$2,$2,$2,1000,2,'https://placehold.co/800x800/png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [productId, `pedido-${productId}`]);
    for (const [id, age] of [[orderId, "4 minutes 40 seconds"], [expiredId, "5 minutes 1 second"], [timezoneId, "1 day"]]) {
      await db.query(`INSERT INTO public.orders (id,user_id,status,subtotal_in_cents,total_in_cents,address_snapshot,created_at,updated_at) VALUES ($1,$2,'FINALIZED',1000,1000,$3,now()-$4::interval,now())`, [id, userId, JSON.stringify({ street: "Rua teste", number: "1", city: "Cidade", state: "SP" }), age]);
      await db.query('INSERT INTO public.order_items (id,order_id,product_id,product_name,product_sku,unit_price_in_cents,quantity,line_total_in_cents) VALUES ($1,$2,$3,$4,$5,1000,1,1000)', [randomUUID(), id, productId, "Nome histórico", "SKU histórico"]);
    }
    await db.query("UPDATE public.orders SET created_at = '2026-01-01T00:00:00Z' WHERE id = $1", [timezoneId]);
    await pages[1].goto(`/pedidos/${orderId}`);
    await expect(pages[1].getByText("Nome histórico")).toHaveCount(0);
    await pages[0].goto("/pedidos");
    await expect(pages[0].getByText(orderId, { exact: false })).toBeVisible();
    await pages[0].goto(`/pedidos/${timezoneId}`);
    await expect(pages[0].getByText(/31 de dezembro de 2025.*21:00/)).toBeVisible();
    await pages[0].goto(`/pedidos/${expiredId}`);
    await pages[0].getByRole("button", { name: "Cancelar pedido" }).click();
    await pages[0].getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "fora do prazo" })).toBeVisible();
    const otherTab = await contexts[0].newPage();
    await Promise.all([pages[0].goto(`/pedidos/${orderId}`), otherTab.goto(`/pedidos/${orderId}`)]);
    await expect(pages[0].getByText("Nome histórico", { exact: false })).toBeVisible();
    await Promise.all([pages[0], otherTab].map(page => page.getByRole("button", { name: "Cancelar pedido" }).click()));
    await Promise.all([pages[0], otherTab].map(page => page.getByRole("button", { name: "Confirmar cancelamento" }).click()));
    await expect.poll(async () => (await db.query('SELECT status FROM public.orders WHERE id = $1', [orderId])).rows[0].status).toBe("CANCELLED");
    expect((await db.query('SELECT stock FROM public.products WHERE id = $1', [productId])).rows[0].stock).toBe(3);
    expect((await db.query('SELECT status FROM public.orders WHERE id = $1', [expiredId])).rows[0].status).toBe("FINALIZED");
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await db.query('DELETE FROM public.orders WHERE id = ANY($1::uuid[])', [[orderId, expiredId, timezoneId]]);
    await db.query('DELETE FROM public.users WHERE email = ANY($1::text[])', [emails]);
    await db.query('DELETE FROM public.products WHERE id = $1', [productId]);
    await db.end();
  }
});
