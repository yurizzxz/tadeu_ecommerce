import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import { products } from "./catalog";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || (process.env.DATABASE_URL && testUrl === process.env.DATABASE_URL)) {
  throw new Error("Configure TEST_DATABASE_URL distinto do banco da aplicação.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: testUrl }, { schema: "public" }) });
async function main() {
 try {
  for (const item of products) {
    const category = await db.category.upsert({ where: { slug: item.categorySlug }, update: { name: item.category }, create: { slug: item.categorySlug, name: item.category } });
    const brand = await db.brand.upsert({ where: { slug: item.brandSlug }, update: { name: item.brand }, create: { slug: item.brandSlug, name: item.brand } });
    const data = { name: item.name, sku: item.sku, description: item.description, priceInCents: item.priceInCents, stock: item.stock, specifications: item.specifications, imageUrl: `https://placehold.co/800x800/png?text=${encodeURIComponent(item.name)}`, isActive: true, categoryId: category.id, brandId: brand.id };
    await db.product.upsert({ where: { slug: item.slug }, update: data, create: { slug: item.slug, ...data } });
  }
  console.log(`Seed demonstrativo aplicado: ${products.length} produtos.`);
 } finally {
   await db.$disconnect();
 }
}
main().catch(() => { console.error("Falha ao aplicar seed demonstrativo."); process.exitCode = 1; });
