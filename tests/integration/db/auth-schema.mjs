import { getAuthTables } from "better-auth/db";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const schema = await readFile("prisma/schema.prisma", "utf8");
const tables = getAuthTables({});
for (const name of ["user", "session", "account", "verification"]) {
  const modelName = name[0].toUpperCase() + name.slice(1);
  const model = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(model, `Modelo ${modelName} ausente`);
  for (const [fieldName, field] of Object.entries(tables[name].fields)) {
    const prismaType = { string: "String", date: "DateTime", boolean: "Boolean", number: "Int" }[field.type];
    assert.ok(prismaType, `Tipo não previsto em ${modelName}.${fieldName}`);
    const declaration = model[1].match(new RegExp(`^\\s*${fieldName}\\s+(\\w+)(\\?)?`, "m"));
    assert.ok(declaration, `Campo ${modelName}.${fieldName} ausente`);
    assert.equal(declaration[1], prismaType, `Tipo incorreto em ${modelName}.${fieldName}`);
    assert.equal(Boolean(declaration[2]), field.required === false, `Obrigatoriedade incorreta em ${modelName}.${fieldName}`);
  }
}
console.log("Campos e obrigatoriedade do Better Auth conferidos com o schema Prisma.");
