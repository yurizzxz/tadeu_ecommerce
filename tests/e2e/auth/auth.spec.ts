import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("cadastro, sessão, saída e novo login", async ({ page }) => {
  const email = `teste-${randomUUID()}@example.invalid`;
  const password = `Senha-${randomUUID()}`;
  await page.goto("/conta");
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Cliente de teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
  const unsupportedUpdate = await page.request.post("/api/auth/update-user", { data: { image: "https://example.invalid/avatar.png" } });
  expect(unsupportedUpdate.status()).toBe(404);
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByLabel("E-mail").fill(email.toUpperCase());
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Cliente de teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("rejeita dados inválidos e não cria sessão para credenciais inválidas", async ({ request }) => {
  const email = `teste-${randomUUID()}@example.invalid`;
  const shortPassword = await request.post("/api/auth/sign-up/email", { data: { name: "Teste", email, password: "curta" } });
  expect(shortPassword.ok()).toBe(false);
  const blankName = await request.post("/api/auth/sign-up/email", { data: { name: "   ", email, password: `Senha-${randomUUID()}` } });
  expect(blankName.ok()).toBe(false);
  const invalidLogin = await request.post("/api/auth/sign-in/email", { data: { email, password: `Senha-${randomUUID()}` } });
  expect(invalidLogin.ok()).toBe(false);
  const session = await request.get("/api/auth/get-session");
  expect(await session.json()).toBeNull();
});
