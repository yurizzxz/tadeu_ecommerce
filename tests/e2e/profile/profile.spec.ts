import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";

config({ quiet: true });

test("perfil exige sessão e mantém nome e endereço isolados por usuário", async ({ browser }) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL) throw new Error("Banco de teste ausente ou não isolado");
  const db = new Client({ connectionString: url });
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  const emails = contexts.map(() => `perfil-${randomUUID()}@example.invalid`);
  try {
    await db.connect();
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    await pages[0].goto("/perfil");
    await expect(pages[0]).toHaveURL(/\/entrar$/);
    for (let i = 0; i < pages.length; i++) {
      await pages[i].goto("/cadastro");
      await pages[i].getByLabel("Nome").fill(`Cliente ${i}`);
      await pages[i].getByLabel("E-mail").fill(emails[i]);
      await pages[i].getByLabel("Senha").fill(`Senha-${randomUUID()}`);
      await pages[i].getByRole("button", { name: "Criar conta" }).click();
      await expect(pages[i].getByRole("heading", { name: "Minha conta" })).toBeVisible();
      await pages[i].getByRole("link", { name: "Editar perfil e endereço" }).click();
    }
    const first = pages[0];
    const stale = await contexts[0].newPage();
    await stale.goto("/perfil");
    const otherUser = await db.query('SELECT id FROM public.users WHERE email = $1', [emails[1]]);
    expect(otherUser.rowCount).toBe(1);
    await first.getByLabel("Nome").evaluate((input, userId: string) => {
      const field = document.createElement("input");
      field.type = "hidden";
      field.name = "userId";
      field.value = userId;
      input.closest("form")?.appendChild(field);
    }, otherUser.rows[0].id);
    await first.getByLabel("Nome").fill("Nome atualizado");
    await first.getByRole("button", { name: "Salvar nome" }).click();
    await expect(first.getByRole("status")).toHaveText("Nome atualizado.");
    await first.getByLabel("CEP").fill("12345-678");
    await first.getByLabel("Rua", { exact: true }).fill("Rua de teste");
    await first.getByLabel("Número").fill("10");
    await first.getByLabel("Bairro").fill("Centro");
    await first.getByLabel("Cidade").fill("Cidade de teste");
    await first.getByLabel("UF").fill("SP");
    await first.getByRole("button", { name: "Cadastrar endereço" }).click();
    await expect(first.getByText("Rua de teste, 10")).toBeVisible();
    await expect(first.getByRole("button", { name: "Cadastrar endereço" })).toHaveCount(0);
    await stale.getByLabel("CEP").fill("12345-678");
    await stale.getByLabel("Rua", { exact: true }).fill("Outra rua");
    await stale.getByLabel("Número").fill("20");
    await stale.getByLabel("Bairro").fill("Centro");
    await stale.getByLabel("Cidade").fill("Cidade de teste");
    await stale.getByLabel("UF").fill("SP");
    await stale.getByRole("button", { name: "Cadastrar endereço" }).click();
    await expect(stale.getByRole("alert").filter({ hasText: "Você já possui um endereço cadastrado." })).toBeVisible();
    await contexts[0].clearCookies();
    await stale.getByLabel("Nome").fill("Nome sem sessão");
    await stale.getByRole("button", { name: "Salvar nome" }).click();
    await expect(stale.getByRole("alert").filter({ hasText: "Entre na sua conta para continuar." })).toBeVisible();
    await pages[1].reload();
    await expect(pages[1].getByLabel("Nome")).toHaveValue("Cliente 1");
    await expect(pages[1].getByRole("button", { name: "Cadastrar endereço" })).toBeVisible();
    await expect(pages[1].getByText("Rua de teste, 10")).toHaveCount(0);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await db.query('DELETE FROM public.users WHERE email = ANY($1::text[])', [emails]);
    await db.end();
  }
});
