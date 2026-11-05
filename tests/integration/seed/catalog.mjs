import dotenv from "dotenv";
import pg from "pg";
import assert from "node:assert/strict";
dotenv.config({ quiet: true });
const { Client } = pg;
if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
try {
  await client.connect();
  await client.query("SET search_path TO public");
  const { rows } = await client.query(`SELECT count(*)::int AS total, count(DISTINCT slug)::int AS slugs,
    count(DISTINCT sku)::int AS skus, count(*) FILTER (WHERE price_in_cents < 0 OR stock < 0)::int AS invalid
    FROM products WHERE is_active`);
  assert.deepEqual(rows[0], { total: 10, slugs: 10, skus: 10, invalid: 0 });
  const relations = await client.query(`SELECT count(*)::int AS total FROM products p
    JOIN categories c ON c.id = p.category_id JOIN brands b ON b.id = p.brand_id WHERE p.is_active`);
  assert.equal(relations.rows[0].total, 10);
  console.log("Catálogo de teste contém 10 produtos ativos válidos com slug e SKU únicos.");
} finally { await client.end(); }
