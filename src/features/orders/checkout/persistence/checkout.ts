import "server-only";
import { getDb } from "@/db/client";
import { reviewFingerprint, validReview } from "../application/review";

export class CheckoutError extends Error {}

const select = {
  address: { select: { postalCode: true, street: true, number: true, complement: true, neighborhood: true, city: true, state: true } },
  cart: { select: { id: true, items: { orderBy: { productId: "asc" as const }, select: { productId: true, quantity: true, product: { select: { name: true, sku: true, priceInCents: true, stock: true, isActive: true } } } } } },
};

export async function getReview(userId: string) {
  return getDb().user.findUnique({ where: { id: userId }, select });
}

export async function finalizeCheckout(userId: string, fingerprint: string) {
  return getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM public.users WHERE id = ${userId} FOR UPDATE`;
    let review = await tx.user.findUnique({ where: { id: userId }, select });
    if (!review?.address || !review.cart?.items.length) throw new CheckoutError("Cadastre um endereço e adicione produtos ao carrinho.");
    for (const item of review.cart.items) await tx.$queryRaw`SELECT id FROM public.products WHERE id = ${item.productId}::uuid FOR UPDATE`;
    review = await tx.user.findUnique({ where: { id: userId }, select });
    if (!review?.address || !review.cart?.items.length) throw new CheckoutError("Cadastre um endereço e adicione produtos ao carrinho.");
    if (reviewFingerprint(review) !== fingerprint) throw new CheckoutError("Os dados da compra mudaram. Revise os valores e confirme novamente.");
    let total = 0;
    for (const item of review.cart.items) {
      const changed = await tx.product.updateMany({ where: { id: item.productId, isActive: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
      if (changed.count !== 1 || item.quantity < 1) throw new CheckoutError("Um produto está indisponível ou possui estoque insuficiente.");
      total += item.quantity * item.product.priceInCents;
      if (!Number.isSafeInteger(total) || total > 2147483647) throw new CheckoutError("O total do pedido excede o limite permitido.");
    }
    if (!validReview(review)) throw new CheckoutError("Um produto está indisponível ou possui estoque insuficiente.");
    const order = await tx.order.create({ data: {
      userId, status: "FINALIZED", subtotalInCents: total, totalInCents: total, addressSnapshot: review.address,
      items: { create: review.cart.items.map((item) => ({ productId: item.productId, productName: item.product.name, productSku: item.product.sku, unitPriceInCents: item.product.priceInCents, quantity: item.quantity, lineTotalInCents: item.quantity * item.product.priceInCents })) },
    }, select: { id: true } });
    await tx.cartItem.deleteMany({ where: { cartId: review.cart.id } });
    return order.id;
  });
}
