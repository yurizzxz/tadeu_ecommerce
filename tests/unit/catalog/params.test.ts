import { describe, expect, it } from "vitest";
import { parseCatalogParams } from "../../../src/features/catalog/queries/params";
describe("parâmetros do catálogo", () => {
  it("normaliza texto e preços em reais para centavos", () => expect(parseCatalogParams({ q: "  memória  ", minPrice: "12,50", maxPrice: "90", available: "1" })).toMatchObject({ q: "memória", minPrice: 1250, maxPrice: 9000, available: true }));
  it("ignora entradas inválidas e parâmetros repetidos", () => expect(parseCatalogParams({ q: ["a", "b"], category: "../inválido", minPrice: "-1", available: "sim" })).toMatchObject({ q: "", category: "", minPrice: undefined, available: false }));
  it("ignora teto menor que o mínimo", () => expect(parseCatalogParams({ minPrice: "20", maxPrice: "10" }).maxPrice).toBeUndefined());
});
