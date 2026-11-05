import { createHash } from "node:crypto";

export type ReviewData = {
  address: { postalCode: string; street: string; number: string; complement: string | null; neighborhood: string; city: string; state: string } | null;
  cart: { items: { productId: string; quantity: number; product: { name: string; sku: string; priceInCents: number; stock: number; isActive: boolean } }[] } | null;
};

export function reviewFingerprint(review: ReviewData): string {
  const items = [...(review.cart?.items ?? [])].sort((a, b) => a.productId.localeCompare(b.productId)).map((item) => [item.productId, item.quantity, item.product.name, item.product.sku, item.product.priceInCents, item.product.stock, item.product.isActive]);
  const address = review.address && [review.address.postalCode, review.address.street, review.address.number, review.address.complement, review.address.neighborhood, review.address.city, review.address.state];
  return createHash("sha256").update(JSON.stringify([address, items])).digest("hex");
}

export function validReview(review: ReviewData): boolean {
  const items = review.cart?.items ?? [];
  return !!review.address && items.length > 0 && items.every((item) => item.product.isActive && item.quantity > 0 && item.quantity <= item.product.stock);
}
