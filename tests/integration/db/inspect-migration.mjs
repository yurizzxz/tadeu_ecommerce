import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ quiet: true });
const { Client } = pg;
async function main() {
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query('SELECT logs FROM "_prisma_migrations" WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1');
    const logs = result.rows[0]?.logs || "";
    for (const line of logs.split("\n")) {
      if (/^(Database error code:|ERROR:|ERROR |Error code:|A migration failed)/.test(line.trim())) console.log(line.trim());
    }
  } finally { await client.end(); }
}
main().catch(() => { console.error("Falha ao inspecionar migration"); process.exitCode = 1; });
