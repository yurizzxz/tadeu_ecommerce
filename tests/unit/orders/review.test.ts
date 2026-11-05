import { describe, expect, it } from "vitest";
import { reviewFingerprint, validReview, type ReviewData } from "../../../src/features/orders/checkout/application/review";

const review: ReviewData = { address: { postalCode: "12345678", street: "Rua", number: "1", complement: null, neighborhood: "Centro", city: "Cidade", state: "SP" }, cart: { items: [{ productId: "a", quantity: 1, product: { name: "Produto", sku: "SKU", priceInCents: 100, stock: 2, isActive: true } }] } };

describe("revisão de compra", () => {
  it("detecta mudança de preço ou estoque", () => {
    const changed = structuredClone(review);
    changed.cart!.items[0].product.priceInCents++;
    expect(reviewFingerprint(changed)).not.toBe(reviewFingerprint(review));
    changed.cart!.items[0].product.priceInCents--;
    changed.cart!.items[0].product.stock--;
    expect(reviewFingerprint(changed)).not.toBe(reviewFingerprint(review));
  });
  it("bloqueia ausência de endereço, carrinho vazio e estoque insuficiente", () => {
    expect(validReview(review)).toBe(true);
    expect(validReview({ ...review, address: null })).toBe(false);
    expect(validReview({ ...review, cart: null })).toBe(false);
    const changed = structuredClone(review);
    changed.cart!.items[0].quantity = 3;
    expect(validReview(changed)).toBe(false);
  });
});
