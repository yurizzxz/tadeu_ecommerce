import { getDb } from "@/db/client";

export async function getHomeCatalog() {
  const db = getDb();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true }, orderBy: { name: "asc" }, take: 4,
      select: { id: true, name: true, slug: true, priceInCents: true, imageUrl: true, stock: true, brand: { select: { name: true } } },
    }),
    db.category.findMany({ where: { products: { some: { isActive: true } } }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { products, categories };
}
