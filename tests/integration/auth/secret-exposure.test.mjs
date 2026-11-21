import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import dotenv from "dotenv";

dotenv.config({ quiet: true });
const secrets = ["DATABASE_URL", "TEST_DATABASE_URL", "BETTER_AUTH_SECRET"]
  .map((name) => process.env[name])
  .filter((value) => value && value.length >= 12);

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

test("segredos configurados não aparecem nos arquivos versionados nem no bundle cliente", () => {
  assert.ok(secrets.length > 0, "Nenhum segredo configurado para inspeção");
  const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const files = [...tracked, ...filesIn(".next/static")];
  for (const path of files) {
    const contents = readFileSync(path);
    for (const secret of secrets) {
      assert.equal(contents.includes(Buffer.from(secret)), false, `Segredo configurado encontrado em ${path}`);
    }
  }
});
