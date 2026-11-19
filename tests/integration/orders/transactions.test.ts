import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";
import { sqltag } from "@prisma/client/runtime/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
config({ quiet: true });

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || testUrl === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
process.env.DATABASE_URL = testUrl;

import { getDb } from "../../../src/db/client";
import { reviewFingerprint } from "../../../src/features/orders/checkout/application/review";
import { finalizeCheckout, getReview } from "../../../src/features/orders/checkout/persistence/checkout";
import { cancelOrder, getOrder } from "../../../src/features/orders/history/persistence/orders";
import { cancellationWindow } from "../../../src/features/orders/history/persistence/cancellation-window";

const db = new Client({ connectionString: testUrl });
const users = [randomUUID(), randomUUID()];
const [product, unavailable] = [randomUUID(), randomUUID()].sort();
const suffix = randomUUID();

beforeAll(async () => { await db.connect(); }, 30000);

beforeEach(async () => {
  await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
    SELECT $1,c.id,b.id,$2,$2,$2,$2,1000,1,'https://example.invalid/p.png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [product, suffix]);
  await db.query(`INSERT INTO public.products (id,category_id,brand_id,name,slug,sku,description,price_in_cents,stock,image_url,specifications,is_active,updated_at)
    SELECT $1,c.id,b.id,$2,$2,$2,$2,1000,0,'https://example.invalid/p.png','{}',true,now() FROM public.categories c CROSS JOIN public.brands b LIMIT 1`, [unavailable, `${suffix}-zero`]);
  for (const user of users) {
    await db.query('INSERT INTO public.users (id,name,email,"updatedAt") VALUES ($1,$1,$2,now())', [user, `${user}@example.invalid`]);
    await db.query('INSERT INTO public.addresses (id,user_id,postal_code,street,number,neighborhood,city,state,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())', [randomUUID(), user, "12345678", "Rua", "1", "Centro", "Cidade", "SP"]);
    const cart = randomUUID();
    await db.query('INSERT INTO public.carts (id,user_id,updated_at) VALUES ($1,$2,now())', [cart, user]);
    await db.query('INSERT INTO public.cart_items (id,cart_id,product_id,quantity,updated_at) VALUES ($1,$2,$3,1,now())', [randomUUID(), cart, product]);
  }
}, 30000);

afterEach(async () => {
  await db.query('DELETE FROM public.orders WHERE user_id = ANY($1::text[])', [users]);
  await db.query('DELETE FROM public.users WHERE id = ANY($1::text[])', [users]);
  await db.query('DELETE FROM public.products WHERE id = ANY($1::uuid[])', [[product, unavailable]]);
}, 30000);

afterAll(async () => { await getDb().$disconnect(); await db.end(); }, 30000);

describe("transações de pedido em PostgreSQL", () => {
  it("inclui o limite exato de cinco minutos e recusa o instante seguinte", async () => {
    for (const [now, expected] of [["2026-01-01T00:04:59.999Z", true], ["2026-01-01T00:05:00.000Z", true], ["2026-01-01T00:05:00.001Z", false]] as const) {
      const sql = sqltag`SELECT ${cancellationWindow(sqltag`${now}::timestamptz`)} AS allowed FROM (SELECT ${"2026-01-01T00:00:00.000Z"}::timestamptz AS created_at) AS orders`;
      expect((await db.query(sql.text, sql.values)).rows[0].allowed).toBe(expected);
    }
  }, 30000);

  it("reverte a baixa anterior quando outro item está sem estoque", async () => {
    const cart = await db.query('SELECT id FROM public.carts WHERE user_id = $1', [users[0]]);
    await db.query('INSERT INTO public.cart_items (id,cart_id,product_id,quantity,updated_at) VALUES ($1,$2,$3,1,now())', [randomUUID(), cart.rows[0].id, unavailable]);
    const review = await getReview(users[0]);
    if (!review) throw new Error("Revisão ausente");
    await expect(finalizeCheckout(users[0], reviewFingerprint(review))).rejects.toThrow();
    expect((await db.query('SELECT stock FROM public.products WHERE id = $1', [product])).rows[0].stock).toBe(1);
    expect((await db.query('SELECT count(*)::int AS n FROM public.orders WHERE user_id = $1', [users[0]])).rows[0].n).toBe(0);
    expect((await db.query('SELECT count(*)::int AS n FROM public.cart_items WHERE cart_id = $1', [cart.rows[0].id])).rows[0].n).toBe(2);
    await db.query('DELETE FROM public.cart_items WHERE cart_id = $1 AND product_id = $2', [cart.rows[0].id, unavailable]);
  }, 30000);

  it("protege o último item e repõe estoque uma única vez", async () => {
    const reviews = await Promise.all(users.map(getReview));
    if (!reviews[0] || !reviews[1]) throw new Error("Revisões ausentes");
    const results = await Promise.allSettled(reviews.map((review, index) => finalizeCheckout(users[index], reviewFingerprint(review!))));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    const orders = await db.query('SELECT id,user_id,total_in_cents,address_snapshot FROM public.orders WHERE user_id = ANY($1::text[])', [users]);
    expect(orders.rowCount).toBe(1);
    expect(orders.rows[0]).toMatchObject({ total_in_cents: 1000, address_snapshot: { postalCode: "12345678" } });
    const snapshots = await db.query('SELECT product_name,unit_price_in_cents,quantity FROM public.order_items WHERE order_id = $1', [orders.rows[0].id]);
    expect(snapshots.rows).toEqual([{ product_name: suffix, unit_price_in_cents: 1000, quantity: 1 }]);
    const winner = orders.rows[0].user_id as string;
    const other = users.find(user => user !== winner)!;
    const id = orders.rows[0].id as string;
    expect(await getOrder(other, id)).toBeNull();
    expect(await cancelOrder(other, id)).toBe(false);
    const cancellations = await Promise.all([cancelOrder(winner, id), cancelOrder(winner, id)]);
    expect(cancellations.filter(Boolean)).toHaveLength(1);
    expect(await cancelOrder(winner, id)).toBe(false);
    expect((await db.query('SELECT stock FROM public.products WHERE id = $1', [product])).rows[0].stock).toBe(1);
  }, 30000);

  it("recusa pedido expirado sem alterar estoque", async () => {
    const id = randomUUID();
    await db.query("INSERT INTO public.orders (id,user_id,status,subtotal_in_cents,total_in_cents,address_snapshot,created_at,updated_at) VALUES ($1,$2,'FINALIZED',1000,1000,'{}',now()-interval '6 minutes',now())", [id, users[0]]);
    await db.query('INSERT INTO public.order_items (id,order_id,product_id,product_name,product_sku,unit_price_in_cents,quantity,line_total_in_cents) VALUES ($1,$2,$3,$4,$4,1000,1,1000)', [randomUUID(), id, product, suffix]);
    expect(await cancelOrder(users[0], id)).toBe(false);
    expect((await db.query('SELECT stock FROM public.products WHERE id = $1', [product])).rows[0].stock).toBe(1);
  }, 30000);
});
