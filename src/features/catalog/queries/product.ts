import { cache } from "react";
import { getDb } from "@/db/client";

export const getProduct = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getDb().product.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, sku: true, description: true, priceInCents: true, stock: true, imageUrl: true, specifications: true, brand: { select: { name: true } }, category: { select: { name: true, slug: true } } },
  });
});
