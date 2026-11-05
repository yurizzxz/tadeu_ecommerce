type Input = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const slug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "";
function price(value: string): number | undefined {
  if (!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value)) return undefined;
  const amount = Math.round(Number(value.replace(",", ".")) * 100);
  return Number.isSafeInteger(amount) && amount <= 2147483647 ? amount : undefined;
}
export function parseCatalogParams(input: Input) {
  const minPrice = price(single(input.minPrice));
  const max = price(single(input.maxPrice));
  return {
    q: single(input.q).trim().slice(0, 200), category: slug(single(input.category)), brand: slug(single(input.brand)),
    minPrice, maxPrice: minPrice !== undefined && max !== undefined && minPrice > max ? undefined : max,
    available: single(input.available) === "1",
  };
}
