import { expect, test } from "@playwright/test";
import { config } from "dotenv";
import { Client } from "pg";
import { sqltag } from "@prisma/client/runtime/client";
import { cancellationWindow } from "../../../src/features/orders/history/persistence/cancellation-window";

config({ quiet: true });

test("janela de cancelamento inclui o instante exato de cinco minutos", async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  await db.connect();
  try {
    const created = "2026-01-01T00:00:00.000Z";
    for (const [now, expected] of [
      ["2026-01-01T00:04:59.999Z", true],
      ["2026-01-01T00:05:00.000Z", true],
      ["2026-01-01T00:05:00.001Z", false],
    ] as const) {
      const sql = sqltag`SELECT ${cancellationWindow(sqltag`${now}::timestamptz`)} AS allowed FROM (SELECT ${created}::timestamptz AS created_at) AS orders`;
      const result = await db.query(sql.text, sql.values);
      expect(result.rows[0].allowed).toBe(expected);
    }
  } finally {
    await db.end();
  }
});
