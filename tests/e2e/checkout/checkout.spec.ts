import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

test("checkout reverte falhas, exige revisão atual e protege último estoque", async ({ browser }) => {
  test.setTimeout(90000);
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  const emails = contexts.map(() => `checkout-${randomUUID()}@example.invalid`);
  const ids = [randomUUID(), randomUUID(), randomUUID()].sort();
  const suffix = randomUUID();
  try {
    await db.connect();
    for (let i = 0; i < ids.length; i++) {
      const slug = `checkout-${suffix}-${i}`;
      await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
        SELECT $1,c.id,b.id,$2,$2,$2,$2,1000,$3,'https://placehold.co/800x800/png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [ids[i], slug, i === 1 ? 0 : i === 2 ? 1 : 2]);
    }
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    await pages[0].goto("/checkout");
    await expect(pages[0]).toHaveURL(/\/entrar$/);
    for (let i = 0; i < pages.length; i++) {
      await pages[i].goto("/cadastro");
      await pages[i].getByLabel("Nome").fill(`Checkout ${i}`);
      await pages[i].getByLabel("E-mail").fill(emails[i]);
      await pages[i].getByLabel("Senha").fill(`Senha-${randomUUID()}`);
      await pages[i].getByRole("button", { name: "Criar conta" }).click();
      await expect(pages[i].getByRole("heading", { name: "Minha conta" })).toBeVisible();
    }
    const lastSignupAt = Date.now();
    const users: string[] = [];
    for (const email of emails) users.push((await db.query('SELECT id FROM public.users WHERE email = $1', [email])).rows[0].id as string);
    await pages[0].goto("/checkout");
    await expect(pages[0].getByText(/Cadastre um endereço/)).toBeVisible();
    await expect(pages[0].getByText("Seu carrinho está vazio.", { exact: false })).toBeVisible();
    for (let i = 0; i < users.length; i++) {
      await db.query('INSERT INTO public.addresses (id,user_id,postal_code,street,number,neighborhood,city,state,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())', [randomUUID(), users[i], "12345678", "Rua teste", "1", "Centro", "Cidade", "SP"]);
      const cartId = randomUUID();
      await db.query('INSERT INTO public.carts (id,user_id,updated_at) VALUES ($1,$2,now())', [cartId, users[i]]);
      for (const productId of i === 0 ? ids.slice(0, 2) : [ids[2]]) await db.query('INSERT INTO public.cart_items (id,cart_id,product_id,quantity,updated_at) VALUES ($1,$2,$3,1,now())', [randomUUID(), cartId, productId]);
    }
    await pages[0].reload();
    await expect(pages[0].getByRole("button", { name: "Finalizar pedido" })).toBeDisabled();
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).evaluate((button: HTMLButtonElement) => { button.disabled = false; });
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "estoque insuficiente" })).toBeVisible();
    const afterRollback = await db.query('SELECT stock FROM public.products WHERE id = $1', [ids[0]]);
    expect(afterRollback.rows[0].stock).toBe(2);
    expect((await db.query('SELECT count(*)::int AS n FROM public.orders WHERE user_id = $1', [users[0]])).rows[0].n).toBe(0);
    expect((await db.query('SELECT count(*)::int AS n FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id WHERE c.user_id = $1', [users[0]])).rows[0].n).toBe(2);
    await db.query('UPDATE public.products SET stock = 1 WHERE id = $1', [ids[1]]);
    await pages[0].reload();
    await db.query('UPDATE public.products SET stock = 2 WHERE id = $1', [ids[1]]);
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "dados da compra mudaram" })).toBeVisible();
    expect((await db.query('SELECT count(*)::int AS n FROM public.orders WHERE user_id = $1', [users[0]])).rows[0].n).toBe(0);
    await db.query('UPDATE public.products SET price_in_cents = 1500 WHERE id = $1', [ids[0]]);
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).click();
    await expect(pages[0].getByRole("alert").filter({ hasText: "dados da compra mudaram" })).toBeVisible();
    await expect(pages[0].getByText("Total: R$ 25,00", { exact: true })).toBeVisible();
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).evaluate((button, userId: string) => {
      for (const [name, value] of [["userId", userId], ["total", "1"]]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        button.closest("form")?.appendChild(input);
      }
    }, users[1]);
    await pages[0].getByRole("button", { name: "Finalizar pedido" }).click();
    await expect(pages[0].getByRole("status").filter({ hasText: "Pedido finalizado" })).toBeVisible();
    const orders = await db.query('SELECT id,status,total_in_cents,address_snapshot FROM public.orders WHERE user_id = $1', [users[0]]);
    expect(orders.rowCount).toBe(1);
    expect(orders.rows[0]).toMatchObject({ status: "FINALIZED", total_in_cents: 2500, address_snapshot: { postalCode: "12345678", city: "Cidade" } });
    const snapshots = await db.query('SELECT product_id,unit_price_in_cents,quantity FROM public.order_items WHERE order_id = $1 ORDER BY product_id', [orders.rows[0].id]);
    expect(snapshots.rows).toMatchObject([{ product_id: ids[0], unit_price_in_cents: 1500, quantity: 1 }, { product_id: ids[1], unit_price_in_cents: 1000, quantity: 1 }]);
    expect((await db.query('SELECT count(*)::int AS n FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id WHERE c.user_id = $1', [users[0]])).rows[0].n).toBe(0);
    await Promise.all([pages[1].goto("/checkout"), pages[2].goto("/checkout")]);
    await Promise.all([pages[1], pages[2]].map((page) => page.getByRole("button", { name: "Finalizar pedido" }).click()));
    await expect.poll(async () => (await db.query('SELECT count(*)::int AS n FROM public.orders WHERE user_id = ANY($1::text[])', [[users[1], users[2]]])).rows[0].n).toBe(1);
    expect((await db.query('SELECT stock FROM public.products WHERE id = $1', [ids[2]])).rows[0].stock).toBe(0);
    expect((await db.query('SELECT count(*)::int AS n FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id WHERE c.user_id = ANY($1::text[])', [[users[1], users[2]]])).rows[0].n).toBe(1);
    // Better Auth limita cadastros por dez segundos; aguarde a janela para não interferir nos testes seguintes.
    const remaining = Math.max(0, lastSignupAt + 10250 - Date.now());
    if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await db.query('DELETE FROM public.orders WHERE user_id IN (SELECT id FROM public.users WHERE email = ANY($1::text[]))', [emails]);
    await db.query('DELETE FROM public.users WHERE email = ANY($1::text[])', [emails]);
    await db.query('DELETE FROM public.products WHERE id = ANY($1::uuid[])', [ids]);
    await db.end();
  }
});
