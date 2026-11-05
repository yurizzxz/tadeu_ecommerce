import "server-only";
import { getDb } from "@/db/client";

export class CartError extends Error {}

export async function getCart(userId: string) {
  return getDb().cart.findUnique({ where: { userId }, include: { items: { orderBy: { createdAt: "asc" }, include: { product: { select: { name: true, slug: true, priceInCents: true, stock: true, isActive: true } } } } } });
}

export async function mutateCart(userId: string, operation: "add" | "update" | "remove", id: string, quantity?: number) {
  const db = getDb();
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM public.users WHERE id = ${userId} FOR UPDATE`;
    let productId = id;
    const existingItem = operation === "add" ? null : await tx.cartItem.findFirst({ where: { id, cart: { userId } }, select: { id: true, productId: true } });
    if (operation !== "add" && !existingItem) throw new CartError("Item não encontrado no seu carrinho.");
    if (existingItem) productId = existingItem.productId;
    if (operation === "remove" && existingItem) {
      await tx.cartItem.delete({ where: { id: existingItem.id } });
      return;
    }
    await tx.$queryRaw`SELECT id FROM public.products WHERE id = ${productId}::uuid FOR SHARE`;
    const product = await tx.product.findUnique({ where: { id: productId }, select: { isActive: true, stock: true } });
    if (!product?.isActive || product.stock < 1) throw new CartError("Produto indisponível.");
    if (!quantity) throw new CartError("Informe uma quantidade válida.");
    if (operation === "update" && existingItem) {
      if (quantity > product.stock) throw new CartError("Quantidade acima do estoque disponível.");
      await tx.cartItem.update({ where: { id: existingItem.id }, data: { quantity } });
      return;
    }
    const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });
    const item = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    const newQuantity = (item?.quantity ?? 0) + quantity;
    if (newQuantity > product.stock) throw new CartError("Quantidade acima do estoque disponível.");
    if (item) await tx.cartItem.update({ where: { id: item.id }, data: { quantity: newQuantity } });
    else await tx.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  });
}
