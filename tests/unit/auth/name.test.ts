import { describe, expect, it } from "vitest";
import { normalizeName } from "../../../src/features/auth/application/name";

describe("nome no cadastro", () => {
  it("remove espaços externos", () => expect(normalizeName("  Ana Maria  ")).toBe("Ana Maria"));
  it("rejeita nome vazio", () => expect(normalizeName("   ")).toBeNull());
});
