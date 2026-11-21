import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ getSession: vi.fn().mockRejectedValue(new Error("sensitive-error-content")) }));
vi.mock("@/features/profile/persistence/profile", () => ({ insertAddress: vi.fn(), updateName: vi.fn() }));
vi.mock("@/features/cart/persistence/cart", () => ({ CartError: class CartError extends Error {}, mutateCart: vi.fn() }));
vi.mock("@/features/orders/checkout/persistence/checkout", () => ({ CheckoutError: class CheckoutError extends Error {}, finalizeCheckout: vi.fn() }));
vi.mock("@/features/orders/history/persistence/orders", () => ({ cancelOrder: vi.fn() }));

import { saveName } from "../../../src/features/profile/application/actions";
import { addItem } from "../../../src/features/cart/application/actions";
import { confirmCheckout } from "../../../src/features/orders/checkout/application/actions";
import { cancelOrderAction } from "../../../src/features/orders/history/application/actions";

afterEach(() => vi.restoreAllMocks());

it("registra falhas inesperadas das actions sem expor dados do erro", async () => {
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  const state = { message: "", success: false };
  const profile = new FormData();
  profile.set("name", "Nome de teste");
  const cart = new FormData();
  cart.set("productId", "123e4567-e89b-42d3-a456-426614174000");
  cart.set("quantity", "1");
  const checkout = new FormData();
  checkout.set("review", "a".repeat(64));
  const order = new FormData();
  order.set("orderId", "123e4567-e89b-42d3-a456-426614174000");
  order.set("confirm", "yes");
  for (const result of await Promise.all([saveName(state, profile), addItem(state, cart), confirmCheckout(state, checkout), cancelOrderAction(state, order)])) {
    expect(result.success).toBe(false);
  }
  expect(output).toHaveBeenCalledTimes(4);
  const entries = output.mock.calls.map(([line]) => JSON.parse(line));
  expect(entries.map((entry) => entry.operation).sort()).toEqual(["cart.add", "checkout.confirm", "order.cancel", "profile.name"]);
  expect(JSON.stringify(entries)).not.toContain("sensitive-error-content");
});
