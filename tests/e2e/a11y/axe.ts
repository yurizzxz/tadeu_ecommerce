import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page } from "@playwright/test";

// axe-core já integra a árvore de dependências do eslint-plugin-jsx-a11y.
const store = resolve(process.cwd(), "node_modules/.pnpm");
const axePackage = readdirSync(store).find((name) => name.startsWith("axe-core@"));
if (!axePackage) throw new Error("axe-core não encontrado nas dependências instaladas");
const axePath = resolve(store, axePackage, "node_modules/axe-core/axe.min.js");

export async function checkAccessibility(page: Page) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document, options: object) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return result.violations;
  });
  expect(violations).toEqual([]);
}
