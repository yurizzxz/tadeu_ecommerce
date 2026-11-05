import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
dotenv.config({ quiet: true });

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || (process.env.DATABASE_URL && testUrl === process.env.DATABASE_URL)) {
  console.error("Configure um TEST_DATABASE_URL distinto de DATABASE_URL.");
  process.exit(1);
}

const action = process.argv[2] === "resolve-initial"
  ? ["migrate", "resolve", "--rolled-back", "20261105000000_initial"]
  : ["migrate", "deploy"];
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...action], {
  env: { ...process.env, DATABASE_URL: testUrl },
  encoding: "utf8",
});
if (result.status !== 0) {
  console.error("Falha ao aplicar migrations no banco de teste.");
  const errorCode = `${result.stdout}\n${result.stderr}`.match(/\bP\d{4}\b/);
  if (errorCode) console.error(`Código Prisma: ${errorCode[0]}`);
  process.exit(result.status || 1);
}
console.log("Migrations aplicadas no banco de teste.");
