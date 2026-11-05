import { getDb } from "@/db/client";
import type { Prisma } from "@/db/generated/client";
import type { parseCatalogParams } from "./params";

export async function getCatalog(params: ReturnType<typeof parseCatalogParams>) {
  const db = getDb();
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(params.q && { OR: [
      { name: { contains: params.q, mode: "insensitive" } }, { description: { contains: params.q, mode: "insensitive" } },
      { brand: { name: { contains: params.q, mode: "insensitive" } } }, { category: { name: { contains: params.q, mode: "insensitive" } } },
    ] }),
    ...(params.category && { category: { slug: params.category } }),
    ...(params.brand && { brand: { slug: params.brand } }),
    ...((params.minPrice !== undefined || params.maxPrice !== undefined) && { priceInCents: { gte: params.minPrice, lte: params.maxPrice } }),
    ...(params.available && { stock: { gt: 0 } }),
  };
  const [products, categories, brands] = await Promise.all([
    db.product.findMany({ where, select: { id: true, name: true, slug: true, priceInCents: true, stock: true, imageUrl: true, brand: { select: { name: true } }, category: { select: { name: true } } } }),
    db.category.findMany({ where: { products: { some: { isActive: true } } }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    db.brand.findMany({ where: { products: { some: { isActive: true } } }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  return { products, categories, brands };
}
