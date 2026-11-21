import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
dotenv.config({ quiet: true });
if (!process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL && process.env.TEST_DATABASE_URL === process.env.DATABASE_URL)) {
  throw new Error("Configure TEST_DATABASE_URL diferente do banco da aplicação.");
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), BETTER_AUTH_URL: "http://127.0.0.1:3000" },
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
