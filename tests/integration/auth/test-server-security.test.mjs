import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

test("servidor de teste recusa URL igual à da aplicação antes de iniciar", () => {
  const url = "postgresql://example:example@127.0.0.1:5432/example";
  const result = spawnSync(process.execPath, ["tests/integration/auth/test-server.mjs"], {
    env: { ...process.env, DATABASE_URL: url, TEST_DATABASE_URL: url },
    encoding: "utf8",
    timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /TEST_DATABASE_URL diferente/);
});
