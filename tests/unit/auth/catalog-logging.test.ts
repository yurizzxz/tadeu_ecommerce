import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/catalog/queries/home", () => ({ getHomeCatalog: vi.fn().mockRejectedValue(new Error("sensitive-home-error")) }));
vi.mock("@/features/catalog/queries/catalog", () => ({ getCatalog: vi.fn().mockRejectedValue(new Error("sensitive-catalog-error")) }));

import Home from "../../../src/app/(public)/page";
import CatalogPage from "../../../src/app/(public)/produtos/page";

afterEach(() => vi.restoreAllMocks());

it("registra falhas nas leituras públicas sem incluir o erro", async () => {
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  await Home();
  await CatalogPage({ searchParams: Promise.resolve({}) });
  expect(output).toHaveBeenCalledTimes(2);
  const entries = output.mock.calls.map(([line]) => JSON.parse(line));
  expect(entries.map((entry) => entry.operation)).toEqual(["catalog.home", "catalog.list"]);
  expect(JSON.stringify(entries)).not.toContain("sensitive-");
});
