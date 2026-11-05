import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getCart } from "@/features/cart/persistence/cart";
import { CartItemControls } from "@/features/cart/components/cart-forms";
import "./carrinho.css";

export const metadata: Metadata = { title: "Carrinho | DevStore", robots: { index: false, follow: false } };
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const cart = await getCart(session.user.id);
  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceInCents, 0);
  return <main className="container cart-page"><h1>Meu carrinho</h1>{items.length === 0 ? <div><p>Seu carrinho está vazio.</p><Link className="text-link" href="/produtos">Explorar produtos</Link></div> : <><ul className="cart-items">{items.map((item) => <li key={item.id}><div><h2><Link href={`/produtos/${item.product.slug}`}>{item.product.name}</Link></h2><p>{money(item.product.priceInCents)} por unidade</p><p>{!item.product.isActive || item.product.stock === 0 ? "Produto indisponível" : item.quantity > item.product.stock ? `Estoque atual: ${item.product.stock}` : "Disponível"}</p><p>Subtotal: {money(item.product.priceInCents * item.quantity)}</p></div><CartItemControls itemId={item.id} quantity={item.quantity} stock={item.product.stock} /></li>)}</ul><p className="cart-total">Total: {money(total)}</p></>}</main>;
}
