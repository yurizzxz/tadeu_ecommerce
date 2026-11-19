import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getOrder } from "@/features/orders/history/persistence/orders";
import { CancelForm } from "@/features/orders/history/components/cancel-form";
import "../pedidos.css";

export const metadata: Metadata = { title: "Detalhes do pedido | DevStore", robots: { index: false, follow: false } };
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const order = await getOrder(session.user.id, id);
  if (!order) notFound();
  const address = order.addressSnapshot;
  const fields = address && typeof address === "object" && !Array.isArray(address) ? address : {};
  const field = (key: string) => typeof fields[key] === "string" ? fields[key] : "";
  return <main className="container orders-page"><Link href="/pedidos">← Meus pedidos</Link><h1>Detalhes do pedido</h1><p>Pedido {order.id}</p><p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(order.createdAt)} · {order.status === "FINALIZED" ? "Finalizado" : "Cancelado"}</p><section><h2>Produtos</h2><ul>{order.items.map(item => <li key={item.id}>{item.productName} · SKU {item.productSku} · {item.quantity} × {money(item.unitPriceInCents)} <strong>{money(item.lineTotalInCents)}</strong></li>)}</ul><p>Total: <strong>{money(order.totalInCents)}</strong></p></section><section><h2>Endereço de entrega</h2><p>{field("street")}, {field("number")} {field("complement")}</p><p>{field("neighborhood")} — {field("city")}/{field("state")} · CEP {field("postalCode")}</p></section>{order.status === "FINALIZED" && <section><p>O cancelamento pode ser solicitado até cinco minutos após a criação do pedido.</p><CancelForm id={order.id} deadline={new Date(order.createdAt.getTime() + 5 * 60 * 1000).toISOString()} /></section>}</main>;
}
