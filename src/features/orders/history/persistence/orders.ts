import "server-only";
import { getDb } from "@/db/client";
import { sqltag } from "@prisma/client/runtime/client";
import { cancellationWindow } from "./cancellation-window";

export function listOrders(userId: string) {
  return getDb().order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, status: true, totalInCents: true } });
}

export function getOrder(userId: string, id: string) {
  return getDb().order.findFirst({ where: { id, userId }, include: { items: true } });
}

export async function cancelOrder(userId: string, id: string) {
  return getDb().$transaction(async (tx) => {
    // O relógio do banco é avaliado após obter o lock, inclusive em chamadas concorrentes.
    const changed = await tx.$queryRaw<{ id: string }[]>`UPDATE public.orders SET status = 'CANCELLED', cancelled_at = clock_timestamp(), updated_at = clock_timestamp() WHERE id = ${id}::uuid AND user_id = ${userId} AND status = 'FINALIZED' AND ${cancellationWindow(sqltag`clock_timestamp()`)} RETURNING id`;
    if (!changed.length) return false;
    const items = await tx.orderItem.findMany({ where: { orderId: id }, orderBy: { productId: "asc" } });
    for (const item of items) {
      if (!item.productId) throw new Error("Produto indisponível para reposição");
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    return true;
  });
}
