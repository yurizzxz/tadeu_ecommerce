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
    await client.query("SAVEPOINT invalid_product");
    let rejected = false;
    try {
      await client.query('INSERT INTO products (id, category_id, brand_id, name, slug, sku, description, price_in_cents, stock, image_url, specifications, updated_at) VALUES ($1,$2,$3,$4,$4,$4,$4,-1,0,$4,$5,now())', [randomUUID(), category, brand, suffix, "{}"]);
    } catch (error) {
      if (error.code !== "23514") throw error;
      rejected = true;
    }
    await client.query("ROLLBACK TO SAVEPOINT invalid_product");
    if (!rejected) throw new Error("Preço negativo foi aceito");
    await client.query("ROLLBACK");
    console.log("Constraints e índices encontrados; preço negativo rejeitado em transação revertida.");
  } finally { await client.end(); }
}
main().catch(() => { console.error("Falha na verificação das constraints"); process.exitCode = 1; });
