const states = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));

export function addressFieldError(key: string, value: string): string | null {
  const trimmed = value.trim();
  if (key === "complement") return null;
  if (!trimmed) return "Preencha este campo.";
  if (key === "postalCode" && !/^\d{8}$/.test(trimmed.replace(/[-\s]/g, ""))) return "Informe um CEP com oito dígitos.";
  if (key === "state" && !states.has(trimmed.toUpperCase())) return "Informe uma UF válida, como SP.";
  return null;
}

export function validateName(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

export function validateAddress(form: FormData) {
  for (const key of ["postalCode", "street", "number", "complement", "neighborhood", "city", "state"]) {
    const value = form.get(key);
    if (value !== null && typeof value !== "string") return null;
  }
  const read = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const postalCode = read("postalCode").replace(/[-\s]/g, "");
  const street = read("street");
  const number = read("number");
  const complement = read("complement");
  const neighborhood = read("neighborhood");
  const city = read("city");
  const state = read("state").toUpperCase();
  if (Object.entries({ postalCode, street, number, neighborhood, city, state }).some(([key, value]) => addressFieldError(key, value))) return null;
  return { postalCode, street, number, complement: complement || null, neighborhood, city, state };
}
