"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import { CheckoutError, finalizeCheckout } from "../persistence/checkout";

export type CheckoutState = { message: string; success: boolean };

export async function confirmCheckout(_state: CheckoutState, form: FormData): Promise<CheckoutState> {
  const fingerprint = form.get("review");
  if (typeof fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(fingerprint)) return { message: "Revise a compra antes de confirmar.", success: false };
  try {
    const session = await getSession();
    if (!session) return { message: "Entre na sua conta para continuar.", success: false };
    await finalizeCheckout(session.user.id, fingerprint);
    revalidatePath("/checkout");
    revalidatePath("/carrinho");
    return { message: "Pedido finalizado com sucesso.", success: true };
  } catch (error) {
    revalidatePath("/checkout");
    return { message: error instanceof CheckoutError ? error.message : "Não foi possível finalizar o pedido. Tente novamente.", success: false };
  }
}
