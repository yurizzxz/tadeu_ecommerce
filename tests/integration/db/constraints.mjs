import dotenv from "dotenv";
import pg from "pg";
import { randomUUID } from "node:crypto";
dotenv.config({ quiet: true });
const { Client } = pg;

async function main() {
  if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
    throw new Error("Banco de teste ausente ou não isolado");
  }
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query("SELECT conname FROM pg_constraint WHERE conname = ANY($1::text[])", [[
      "addresses_state_length_check", "products_price_nonnegative_check", "products_stock_nonnegative_check",
      "cart_items_quantity_positive_check", "orders_amounts_nonnegative_check", "order_items_values_check",
    ]]);
    const indexes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY($1::text[])", [[
      "cart_items_cart_id_product_id_key", "addresses_user_id_key", "carts_user_id_key",
    ]]);
    if (result.rowCount !== 6 || indexes.rowCount !== 3) throw new Error("Constraints esperadas não encontradas");
    await client.query("BEGIN");
    const category = randomUUID();
    const brand = randomUUID();
    const suffix = randomUUID();
    await client.query('INSERT INTO categories (id, name, slug, updated_at) VALUES ($1, $2, $2, now())', [category, suffix]);
    await client.query('INSERT INTO brands (id, name, slug, updated_at) VALUES ($1, $2, $2, now())', [brand, suffix]);
    const product = randomUUID();
    await client.query('INSERT INTO products (id, category_id, brand_id, name, slug, sku, description, price_in_cents, stock, image_url, specifications, updated_at) VALUES ($1,$2,$3,$4,$4,$4,$4,100,1,$4,$5,now())', [product, category, brand, suffix, "{}"]);
    const user = randomUUID();
    await client.query('INSERT INTO users (id, name, email, "updatedAt") VALUES ($1, $1, $2, now())', [user, `${suffix}@example.invalid`]);
    const cart = randomUUID();
    await client.query('INSERT INTO carts (id, user_id, updated_at) VALUES ($1, $2, now())', [cart, user]);
    const order = randomUUID();
    await client.query('INSERT INTO orders (id, user_id, status, subtotal_in_cents, total_in_cents, address_snapshot, updated_at) VALUES ($1,$2,\'FINALIZED\',100,100,$3,now())', [order, user, "{}"]);
    const expectReject = async (sql, params, code) => {
      await client.query("SAVEPOINT invalid_value");
      let rejected = false;
      try { await client.query(sql, params); } catch (error) { if (error.code !== code) throw error; rejected = true; }
      await client.query("ROLLBACK TO SAVEPOINT invalid_value");
      if (!rejected) throw new Error("Valor inválido foi aceito");
    };
    await expectReject('UPDATE products SET price_in_cents = -1 WHERE id = $1', [product], "23514");
    await expectReject('UPDATE products SET stock = -1 WHERE id = $1', [product], "23514");
    await expectReject('INSERT INTO cart_items (id, cart_id, product_id, quantity, updated_at) VALUES ($1,$2,$3,0,now())', [randomUUID(), cart, product], "23514");
    await expectReject('UPDATE orders SET total_in_cents = -1 WHERE id = $1', [order], "23514");
    await expectReject('INSERT INTO order_items (id,order_id,product_name,product_sku,unit_price_in_cents,quantity,line_total_in_cents) VALUES ($1,$2,$3,$3,0,0,0)', [randomUUID(), order, suffix], "23514");
    await expectReject('INSERT INTO addresses (id,user_id,postal_code,street,number,neighborhood,city,state,updated_at) VALUES ($1,$2,$3,$3,$3,$3,$3,\'X\',now())', [randomUUID(), user, suffix], "23514");
    await expectReject('INSERT INTO carts (id,user_id,updated_at) VALUES ($1,$2,now())', [randomUUID(), user], "23505");
    await client.query("ROLLBACK");
    console.log("Constraints e índices encontrados; valores inválidos e duplicidade rejeitados em transação revertida.");
  } finally { await client.end(); }
}
main().catch(() => { console.error("Falha na verificação das constraints"); process.exitCode = 1; });
