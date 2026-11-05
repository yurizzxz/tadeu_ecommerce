"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import { CartError, mutateCart } from "../persistence/cart";
import { parseQuantity, validId } from "./validation";

export type CartState = { message: string; success: boolean };

async function perform(operation: "add" | "update" | "remove", form: FormData): Promise<CartState> {
  const id = form.get(operation === "add" ? "productId" : "itemId");
  const quantity = operation === "remove" ? undefined : parseQuantity(form.get("quantity"));
  if (!validId(id) || quantity === null) return { message: "Dados do carrinho inválidos.", success: false };
  try {
    const session = await getSession();
    if (!session) return { message: "Entre na sua conta para continuar.", success: false };
    await mutateCart(session.user.id, operation, id, quantity);
    revalidatePath("/carrinho");
    return { message: operation === "remove" ? "Produto removido do carrinho." : "Carrinho atualizado.", success: true };
  } catch (error) {
    return { message: error instanceof CartError ? error.message : "Não foi possível atualizar o carrinho. Tente novamente.", success: false };
  }
}

export async function addItem(_state: CartState, form: FormData) { return perform("add", form); }
export async function updateItem(_state: CartState, form: FormData) { return perform("update", form); }
export async function removeItem(_state: CartState, form: FormData) { return perform("remove", form); }
