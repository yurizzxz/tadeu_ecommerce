import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { listOrders } from "@/features/orders/history/persistence/orders";
import "./pedidos.css";

export const metadata: Metadata = { title: "Meus pedidos | DevStore", robots: { index: false, follow: false } };
export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const orders = await listOrders(session.user.id);
  return <main className="container orders-page"><h1>Meus pedidos</h1>{orders.length ? <ul>{orders.map(order => <li key={order.id}><Link href={`/pedidos/${order.id}`}><strong>Pedido {order.id}</strong><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(order.createdAt)} · {order.status === "FINALIZED" ? "Finalizado" : "Cancelado"}</span><span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalInCents / 100)}</span></Link></li>)}</ul> : <p>Você ainda não fez pedidos. <Link href="/produtos">Explorar produtos</Link></p>}</main>;
}
