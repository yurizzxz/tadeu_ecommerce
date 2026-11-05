import { describe, expect, it } from "vitest";
import { parseQuantity, validId } from "../../../src/features/cart/application/validation";

describe("validação do carrinho", () => {
  it("aceita somente quantidades inteiras positivas dentro do limite do banco", () => {
    expect(parseQuantity("1")).toBe(1);
    for (const value of ["0", "-1", "1.5", "1e2", "", "2147483648"]) expect(parseQuantity(value)).toBeNull();
  });
  it("aceita somente identificadores UUID", () => {
    expect(validId("0c7376f1-27d2-408b-8230-1f6c0c5c1d4c")).toBe(true);
    expect(validId("não é uuid")).toBe(false);
  });
});
