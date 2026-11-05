import { describe, expect, it } from "vitest";
import { validateAddress, validateName } from "../../../src/features/profile/application/validation";

function address() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ postalCode: "12345-678", street: "Rua A", number: "12", neighborhood: "Centro", city: "Cidade", state: "sp" })) form.set(key, value);
  return form;
}

describe("validação de perfil", () => {
  it("normaliza nome e rejeita vazio ou valor inválido", () => {
    expect(validateName("  Ana  ")).toBe("Ana");
    expect(validateName("   ")).toBeNull();
    expect(validateName(null)).toBeNull();
  });

  it("normaliza CEP e UF e permite complemento ausente", () => {
    expect(validateAddress(address())).toMatchObject({ postalCode: "12345678", state: "SP", complement: null });
  });

  it("recusa CEP, UF ou campos obrigatórios inválidos", () => {
    for (const [key, value] of [["postalCode", "123"], ["state", "XX"], ["street", "  "]]) {
      const form = address();
      form.set(key, value);
      expect(validateAddress(form)).toBeNull();
    }
  });
});
