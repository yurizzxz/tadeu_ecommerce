import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getReview } from "@/features/orders/checkout/persistence/checkout";
import { reviewFingerprint, validReview } from "@/features/orders/checkout/application/review";
import { ConfirmForm } from "@/features/orders/checkout/components/confirm-form";
import "./checkout.css";

export const metadata: Metadata = { title: "Revisar pedido | DevStore", robots: { index: false, follow: false } };
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const review = await getReview(session.user.id);
  if (!review) redirect("/entrar");
  const items = review.cart?.items ?? [];
  const address = review.address;
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceInCents, 0);
  return <main className="container checkout-page"><h1>Revisar pedido</h1>
    <section><h2>Endereço</h2>{address ? <><p>{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}</p><p>{address.neighborhood} — {address.city}/{address.state} · CEP {address.postalCode}</p></> : <p>Cadastre um endereço no <Link href="/perfil">seu perfil</Link>.</p>}</section>
    <section><h2>Produtos</h2>{items.length ? <ul>{items.map((item) => <li key={item.productId}><span>{item.product.name} · {item.quantity} × {money(item.product.priceInCents)}</span><strong>{money(item.quantity * item.product.priceInCents)}</strong>{(!item.product.isActive || item.quantity > item.product.stock) && <p>Produto indisponível ou estoque insuficiente.</p>}</li>)}</ul> : <p>Seu carrinho está vazio. <Link href="/produtos">Explorar produtos</Link></p>}</section>
    <p className="checkout-total">Total: {money(total)}</p><ConfirmForm fingerprint={reviewFingerprint(review)} disabled={!validReview(review)} />
  </main>;
}
