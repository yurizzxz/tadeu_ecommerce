"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import { cancelOrder } from "../persistence/orders";

export type CancelState = { message: string; success: boolean };
export async function cancelOrderAction(_state: CancelState, form: FormData): Promise<CancelState> {
  const id = form.get("orderId");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || form.get("confirm") !== "yes") return { message: "Confirme o cancelamento do pedido.", success: false };
  try {
    const session = await getSession();
    if (!session) return { message: "Entre na sua conta para continuar.", success: false };
    const cancelled = await cancelOrder(session.user.id, id);
    revalidatePath(`/pedidos/${id}`);
    revalidatePath("/pedidos");
    return cancelled ? { message: "Pedido cancelado.", success: true } : { message: "Não foi possível cancelar. O pedido pode estar fora do prazo ou já cancelado.", success: false };
  } catch {
    return { message: "Não foi possível cancelar o pedido. Tente novamente.", success: false };
  }
}
