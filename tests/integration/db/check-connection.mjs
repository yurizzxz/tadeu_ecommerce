import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ quiet: true });
const { Client } = pg;

async function main() {
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL ausente");
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query("SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    console.log(`Autenticação PostgreSQL: OK; tabelas no schema public: ${result.rows[0].total}`);
  } finally {
    await client.end();
  }
}

main().catch(() => { console.error("Falha de autenticação ou consulta ao PostgreSQL"); process.exitCode = 1; });
